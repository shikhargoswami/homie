import { Request, Response, NextFunction } from 'express';
import { query } from '../database/client';

/**
 * Viewings Controller
 * 
 * Endpoints:
 * - POST /api/viewings - Schedule a viewing (tenant)
 * - GET /api/tenant/viewings - Get tenant's viewings
 * - GET /api/landlord/viewings - Get landlord's viewings
 * - PATCH /api/viewings/:id/confirm - Confirm viewing (landlord)
 * - PATCH /api/viewings/:id/cancel - Cancel viewing
 */

interface ViewingCreateInput {
  propertyId: string;
  date: string;
  time: string;
  notes?: string;
}

/**
 * Schedule a viewing (tenant)
 * POST /api/viewings
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
    if (!input.propertyId || !input.date || !input.time) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Property ID, date and time are required' },
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

    // Check for existing viewing at same time
    const existingViewing = await query(
      `SELECT id FROM viewings 
       WHERE property_id = $1 AND scheduled_date = $2 AND scheduled_time = $3 
       AND status != 'cancelled'`,
      [input.propertyId, input.date, input.time]
    );

    if (existingViewing.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'This time slot is already booked' },
      });
      return;
    }

    // Create viewing
    const result = await query(
      `INSERT INTO viewings (
        property_id, tenant_id, landlord_id, 
        scheduled_date, scheduled_time, notes, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
      RETURNING *`,
      [input.propertyId, tenantId, landlordId, input.date, input.time, input.notes || null]
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
        v.scheduled_date as date,
        v.scheduled_time as time,
        v.status,
        v.notes,
        p.id as property_id,
        p.address as property_address,
        p.neighborhood as property_neighborhood,
        (SELECT photo_url FROM property_photos WHERE property_id = p.id ORDER BY sort_order LIMIT 1) as property_image,
        u.name as counterparty_name,
        u.phone as counterparty_phone
       FROM viewings v
       JOIN properties p ON v.property_id = p.id
       JOIN users u ON v.landlord_id = u.id
       WHERE v.tenant_id = $1
       ORDER BY v.scheduled_date ASC, v.scheduled_time ASC`,
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
          propertyImage: row.property_image,
          date: row.date,
          time: row.time,
          status: row.status,
          notes: row.notes,
          counterpartyName: `${row.counterparty_name} (Owner)`,
          counterpartyPhone: row.status === 'confirmed' ? row.counterparty_phone : undefined,
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
        v.scheduled_date as date,
        v.scheduled_time as time,
        v.status,
        v.notes,
        p.id as property_id,
        p.address as property_address,
        p.neighborhood as property_neighborhood,
        (SELECT photo_url FROM property_photos WHERE property_id = p.id ORDER BY sort_order LIMIT 1) as property_image,
        u.name as counterparty_name,
        u.phone as counterparty_phone
       FROM viewings v
       JOIN properties p ON v.property_id = p.id
       JOIN users u ON v.tenant_id = u.id
       WHERE v.landlord_id = $1
       ORDER BY v.scheduled_date ASC, v.scheduled_time ASC`,
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
          propertyImage: row.property_image,
          date: row.date,
          time: row.time,
          status: row.status,
          notes: row.notes,
          counterpartyName: `${row.counterparty_name} (Tenant)`,
          counterpartyPhone: row.status === 'confirmed' ? row.counterparty_phone : undefined,
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
       SET status = 'confirmed', updated_at = NOW()
       WHERE id = $1 AND landlord_id = $2 AND status = 'pending'
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
 * Cancel viewing
 * PATCH /api/viewings/:id/cancel
 */
export const cancelViewing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Allow both tenant and landlord to cancel
    const result = await query(
      `UPDATE viewings 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND (tenant_id = $2 OR landlord_id = $2) AND status IN ('pending', 'confirmed')
       RETURNING *`,
      [id, userId]
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
