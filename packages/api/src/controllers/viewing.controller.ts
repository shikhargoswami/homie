import { Request, Response, NextFunction } from 'express';
import { query } from '../database/client';

/**
 * Viewings Controller
 * 
 * User Journey Flow:
 * 1. Tenant requests viewing → status: 'proposed'
 * 2. Landlord can approve → status: 'confirmed'
 * 3. Landlord can counter-propose → status: 'counter' (with alternative_datetime)
 * 4. Tenant accepts counter → status: 'confirmed'
 * 5. Either party can cancel → status: 'cancelled'
 * 6. After viewing → status: 'completed' or 'no_show'
 * 
 * Endpoints:
 * - POST /api/viewings - Schedule a viewing (tenant)
 * - GET /api/tenant/viewings - Get tenant's viewings
 * - GET /api/landlord/viewings - Get landlord's viewings
 * - PATCH /api/viewings/:id/confirm - Confirm viewing (landlord)
 * - PATCH /api/viewings/:id/reschedule - Counter-propose new time (landlord)
 * - PATCH /api/viewings/:id/accept - Accept counter-proposal (tenant)
 * - PATCH /api/viewings/:id/cancel - Cancel viewing
 * - PATCH /api/viewings/:id/complete - Mark viewing as completed
 */

interface ViewingCreateInput {
  propertyId: string;
  proposedDatetime: string; // ISO datetime string
  notes?: string;
}

interface ViewingRescheduleInput {
  alternativeDatetime: string; // ISO datetime string
  notes?: string;
}

/**
 * Schedule a viewing (tenant)
 * POST /api/viewings
 * 
 * User Journey: Tenant finds a match and wants to schedule a property visit
 */
export const scheduleViewing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.userId;
    
    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const input: ViewingCreateInput = req.body;

    // Validate required fields
    if (!input.propertyId || !input.proposedDatetime) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Property ID and proposed datetime are required' },
      });
      return;
    }

    // Validate datetime is in the future
    const proposedDate = new Date(input.proposedDatetime);
    if (proposedDate <= new Date()) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Proposed datetime must be in the future' },
      });
      return;
    }

    // Check if property exists and is available
    const propertyCheck = await query(
      'SELECT id, landlord_id FROM properties WHERE id = $1 AND status = \'available\'',
      [input.propertyId]
    );

    if (propertyCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found or not available' },
      });
      return;
    }

    const landlordId = propertyCheck.rows[0].landlord_id;

    // Check for active match between tenant and property (as per user journey)
    const matchCheck = await query(
      `SELECT m.id as match_id, c.id as conversation_id 
       FROM matches m
       LEFT JOIN conversations c ON c.match_id = m.id
       WHERE m.tenant_id = $1 AND m.property_id = $2 
       AND m.status IN ('interested', 'active')`,
      [tenantId, input.propertyId]
    );

    let matchId = null;
    let conversationId = null;

    if (matchCheck.rows.length > 0) {
      matchId = matchCheck.rows[0].match_id;
      conversationId = matchCheck.rows[0].conversation_id;
    }

    // Check for existing pending/confirmed viewing
    const existingViewing = await query(
      `SELECT id FROM viewings 
       WHERE property_id = $1 AND tenant_id = $2
       AND status IN ('proposed', 'counter', 'confirmed')`,
      [input.propertyId, tenantId]
    );

    if (existingViewing.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'You already have a pending or confirmed viewing for this property' },
      });
      return;
    }

    // Create viewing with proper schema columns
    const result = await query(
      `INSERT INTO viewings (
        property_id, tenant_id, landlord_id, 
        match_id, conversation_id,
        proposed_datetime, tenant_notes, 
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'proposed', NOW())
      RETURNING *`,
      [
        input.propertyId, 
        tenantId, 
        landlordId, 
        matchId,
        conversationId,
        input.proposedDatetime, 
        input.notes || null
      ]
    );

    // TODO: Send notification to landlord

    res.status(201).json({
      success: true,
      data: { viewing: result.rows[0] },
      message: 'Viewing request sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tenant's viewings
 * GET /api/tenant/viewings
 * 
 * Returns all viewings for a tenant grouped by status
 */
export const getTenantViewings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.userId;

    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const result = await query(
      `SELECT 
        v.id,
        v.proposed_datetime,
        v.alternative_datetime,
        v.confirmed_datetime,
        v.duration_minutes,
        v.status,
        v.tenant_notes,
        v.landlord_notes,
        v.viewing_rating,
        v.viewing_feedback,
        p.id as property_id,
        p.address as property_address,
        p.neighborhood as property_neighborhood,
        p.city as property_city,
        p.rent as property_rent,
        p.configuration as property_configuration,
        p.photos as property_photos,
        u.name as landlord_name,
        u.phone as landlord_phone,
        lp.rating as landlord_rating
       FROM viewings v
       JOIN properties p ON v.property_id = p.id
       JOIN users u ON v.landlord_id = u.id
       LEFT JOIN landlord_profiles lp ON u.id = lp.user_id
       WHERE v.tenant_id = $1
       ORDER BY 
         CASE v.status 
           WHEN 'confirmed' THEN 1
           WHEN 'proposed' THEN 2
           WHEN 'counter' THEN 3
           ELSE 4
         END,
         COALESCE(v.confirmed_datetime, v.proposed_datetime) ASC`,
      [tenantId]
    );

    res.status(200).json({
      success: true,
      data: {
        viewings: result.rows.map((row: any) => ({
          id: row.id,
          propertyId: row.property_id,
          propertyAddress: row.property_address,
          propertyNeighborhood: row.property_neighborhood,
          propertyCity: row.property_city,
          propertyRent: row.property_rent,
          propertyConfiguration: row.property_configuration,
          propertyImage: row.property_photos?.[0] || null,
          proposedDatetime: row.proposed_datetime,
          alternativeDatetime: row.alternative_datetime,
          confirmedDatetime: row.confirmed_datetime,
          durationMinutes: row.duration_minutes,
          status: row.status,
          tenantNotes: row.tenant_notes,
          landlordNotes: row.landlord_notes,
          viewingRating: row.viewing_rating,
          viewingFeedback: row.viewing_feedback,
          landlordName: row.landlord_name,
          landlordPhone: row.status === 'confirmed' ? row.landlord_phone : undefined,
          landlordRating: row.landlord_rating,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get landlord's viewings
 * GET /api/landlord/viewings
 * 
 * Returns all viewing requests for landlord's properties
 */
export const getLandlordViewings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId;

    if (!landlordId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const result = await query(
      `SELECT 
        v.id,
        v.proposed_datetime,
        v.alternative_datetime,
        v.confirmed_datetime,
        v.duration_minutes,
        v.status,
        v.tenant_notes,
        v.landlord_notes,
        p.id as property_id,
        p.address as property_address,
        p.neighborhood as property_neighborhood,
        p.city as property_city,
        p.photos as property_photos,
        u.name as tenant_name,
        u.phone as tenant_phone,
        tp.employment_status as tenant_employment,
        tp.rating as tenant_rating
       FROM viewings v
       JOIN properties p ON v.property_id = p.id
       JOIN users u ON v.tenant_id = u.id
       LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
       WHERE v.landlord_id = $1
       ORDER BY 
         CASE v.status 
           WHEN 'proposed' THEN 1
           WHEN 'counter' THEN 2
           WHEN 'confirmed' THEN 3
           ELSE 4
         END,
         COALESCE(v.confirmed_datetime, v.proposed_datetime) ASC`,
      [landlordId]
    );

    res.status(200).json({
      success: true,
      data: {
        viewings: result.rows.map((row: any) => ({
          id: row.id,
          propertyId: row.property_id,
          propertyAddress: row.property_address,
          propertyNeighborhood: row.property_neighborhood,
          propertyCity: row.property_city,
          propertyImage: row.property_photos?.[0] || null,
          proposedDatetime: row.proposed_datetime,
          alternativeDatetime: row.alternative_datetime,
          confirmedDatetime: row.confirmed_datetime,
          durationMinutes: row.duration_minutes,
          status: row.status,
          tenantNotes: row.tenant_notes,
          landlordNotes: row.landlord_notes,
          tenantName: row.tenant_name,
          tenantPhone: row.status === 'confirmed' ? row.tenant_phone : undefined,
          tenantEmployment: row.tenant_employment,
          tenantRating: row.tenant_rating,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm viewing (landlord)
 * PATCH /api/viewings/:id/confirm
 * 
 * User Journey: Landlord approves the proposed viewing time
 */
export const confirmViewing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await query(
      `UPDATE viewings 
       SET status = 'confirmed', 
           confirmed_datetime = COALESCE(alternative_datetime, proposed_datetime),
           updated_at = NOW()
       WHERE id = $1 AND landlord_id = $2 AND status IN ('proposed', 'counter')
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Viewing not found or cannot be confirmed' },
      });
      return;
    }

    // TODO: Send notification to tenant

    res.status(200).json({
      success: true,
      data: { viewing: result.rows[0] },
      message: 'Viewing confirmed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reschedule viewing (landlord counter-proposes new time)
 * PATCH /api/viewings/:id/reschedule
 * 
 * User Journey: Landlord proposes alternative time instead of accepting
 */
export const rescheduleViewing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { alternativeDatetime, notes }: ViewingRescheduleInput = req.body;

    if (!alternativeDatetime) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Alternative datetime is required' },
      });
      return;
    }

    // Validate datetime is in the future
    const proposedDate = new Date(alternativeDatetime);
    if (proposedDate <= new Date()) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Alternative datetime must be in the future' },
      });
      return;
    }

    const result = await query(
      `UPDATE viewings 
       SET status = 'counter', 
           alternative_datetime = $3,
           landlord_notes = COALESCE($4, landlord_notes),
           updated_at = NOW()
       WHERE id = $1 AND landlord_id = $2 AND status = 'proposed'
       RETURNING *`,
      [id, userId, alternativeDatetime, notes]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Viewing not found or cannot be rescheduled' },
      });
      return;
    }

    // TODO: Send notification to tenant about counter-proposal

    res.status(200).json({
      success: true,
      data: { viewing: result.rows[0] },
      message: 'Alternative time proposed. Waiting for tenant confirmation.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept counter-proposal (tenant)
 * PATCH /api/viewings/:id/accept
 * 
 * User Journey: Tenant accepts landlord's alternative time
 */
export const acceptCounterProposal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await query(
      `UPDATE viewings 
       SET status = 'confirmed', 
           confirmed_datetime = alternative_datetime,
           updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND status = 'counter'
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Viewing not found or no counter-proposal to accept' },
      });
      return;
    }

    // TODO: Send notification to landlord

    res.status(200).json({
      success: true,
      data: { viewing: result.rows[0] },
      message: 'Viewing confirmed for the new time',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel viewing
 * PATCH /api/viewings/:id/cancel
 * 
 * User Journey: Either party cancels the viewing
 */
export const cancelViewing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    // Allow both tenant and landlord to cancel
    const result = await query(
      `UPDATE viewings 
       SET status = 'cancelled', 
           cancelled_by = $2,
           cancellation_reason = $3,
           updated_at = NOW()
       WHERE id = $1 AND (tenant_id = $2 OR landlord_id = $2) 
       AND status IN ('proposed', 'counter', 'confirmed')
       RETURNING *`,
      [id, userId, reason]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Viewing not found or cannot be cancelled' },
      });
      return;
    }

    // TODO: Send notification to other party

    res.status(200).json({
      success: true,
      data: { viewing: result.rows[0] },
      message: 'Viewing cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark viewing as completed
 * PATCH /api/viewings/:id/complete
 * 
 * User Journey: After the viewing happens, either party marks it complete
 */
export const completeViewing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { rating, feedback } = req.body;

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Rating must be between 1 and 5' },
      });
      return;
    }

    // Only confirmed viewings can be completed
    const result = await query(
      `UPDATE viewings 
       SET status = 'completed',
           viewing_rating = $3,
           viewing_feedback = $4,
           updated_at = NOW()
       WHERE id = $1 AND (tenant_id = $2 OR landlord_id = $2) 
       AND status = 'confirmed'
       RETURNING *`,
      [id, userId, rating, feedback]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Viewing not found or cannot be marked complete' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { viewing: result.rows[0] },
      message: 'Viewing marked as completed',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark viewing as no-show
 * PATCH /api/viewings/:id/no-show
 * 
 * User Journey: If one party doesn't show up
 */
export const markNoShow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await query(
      `UPDATE viewings 
       SET status = 'no_show',
           updated_at = NOW()
       WHERE id = $1 AND (tenant_id = $2 OR landlord_id = $2) 
       AND status = 'confirmed'
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Viewing not found or cannot be marked as no-show' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { viewing: result.rows[0] },
      message: 'Viewing marked as no-show',
    });
  } catch (error) {
    next(error);
  }
};
