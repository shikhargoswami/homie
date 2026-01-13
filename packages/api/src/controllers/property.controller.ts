import { Request, Response, NextFunction } from 'express';
import { query } from '../database/client';

/**
 * Property Controller
 * 
 * Endpoints:
 * - GET /api/properties - Search properties (public)
 * - GET /api/properties/:id - Get property details
 * - POST /api/landlord/properties - Create property (landlord)
 * - PUT /api/landlord/properties/:id - Update property (landlord)
 * - DELETE /api/landlord/properties/:id - Delete property (landlord)
 * - PATCH /api/landlord/properties/:id/status - Update property status
 * - GET /api/landlord/properties - Get landlord's properties
 * - GET /api/landlord/stats - Get landlord dashboard stats
 */

interface PropertyCreateInput {
  address: string;
  neighborhood: string;
  city: string;
  pincode?: string;
  configuration: string;
  furnishing: string;
  rent: number;
  deposit: number;
  area?: number;
  floor?: number;
  totalFloors?: number;
  availableFrom?: string;
  description?: string;
  amenities?: string[];
  photos?: string[];
}

/**
 * Search properties (public endpoint)
 * GET /api/properties
 */
export const searchProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      city,
      neighborhood,
      minRent,
      maxRent,
      configuration,
      furnishing,
      limit = '20',
      offset = '0',
    } = req.query;

    let queryStr = `
      SELECT 
        p.*,
        u.name as landlord_name,
        lp.rating as landlord_rating
      FROM properties p
      JOIN users u ON p.landlord_id = u.id
      LEFT JOIN landlord_profiles lp ON u.id = lp.user_id
      WHERE p.status = 'available'
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (city) {
      queryStr += ` AND LOWER(p.city) = LOWER($${paramIndex})`;
      params.push(city);
      paramIndex++;
    }

    if (neighborhood) {
      queryStr += ` AND LOWER(p.neighborhood) = LOWER($${paramIndex})`;
      params.push(neighborhood);
      paramIndex++;
    }

    if (minRent) {
      queryStr += ` AND p.rent >= $${paramIndex}`;
      params.push(parseInt(minRent as string));
      paramIndex++;
    }

    if (maxRent) {
      queryStr += ` AND p.rent <= $${paramIndex}`;
      params.push(parseInt(maxRent as string));
      paramIndex++;
    }

    if (configuration) {
      queryStr += ` AND p.configuration = $${paramIndex}`;
      params.push(configuration);
      paramIndex++;
    }

    if (furnishing) {
      queryStr += ` AND p.furnishing = $${paramIndex}`;
      params.push(furnishing);
      paramIndex++;
    }

    queryStr += `
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(queryStr, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM properties p WHERE p.status = 'available'
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (city) {
      countQuery += ` AND LOWER(p.city) = LOWER($${countParamIndex})`;
      countParams.push(city);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);

    res.status(200).json({
      success: true,
      data: {
        properties: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get property by ID
 * GET /api/properties/:id
 */
export const getPropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await query(
      `SELECT 
        p.*,
        u.name as landlord_name,
        u.phone as landlord_phone,
        lp.rating as landlord_rating,
        lp.total_tenants as landlord_total_tenants
       FROM properties p
       JOIN users u ON p.landlord_id = u.id
       LEFT JOIN landlord_profiles lp ON u.id = lp.user_id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' },
      });
      return;
    }

    const property = result.rows[0];

    res.status(200).json({
      success: true,
      data: { property },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new property
 * POST /api/landlord/properties
 */
export const createProperty = async (
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

    const input: PropertyCreateInput = req.body;

    // Validate required fields
    if (!input.address || !input.neighborhood || !input.city || !input.rent || !input.deposit) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
      });
      return;
    }

    // Insert property
    const result = await query(
      `INSERT INTO properties (
        landlord_id, address, neighborhood, city, pincode, 
        configuration, furnishing, rent, deposit, area,
        floor, total_floors, available_from, description, photos, amenities, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'available', NOW())
      RETURNING *`,
      [
        landlordId,
        input.address,
        input.neighborhood,
        input.city,
        input.pincode || null,
        input.configuration || '2bhk',
        input.furnishing || 'semi-furnished',
        input.rent,
        input.deposit,
        input.area || null,
        input.floor || null,
        input.totalFloors || null,
        input.availableFrom || null,
        input.description || null,
        input.photos ? JSON.stringify(input.photos) : null,
        input.amenities ? JSON.stringify(input.amenities) : null,
      ]
    );

    res.status(201).json({
      success: true,
      data: { property: result.rows[0] },
      message: 'Property created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update property
 * PUT /api/landlord/properties/:id
 */
export const updateProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId;
    const { id } = req.params;
    const input: PropertyCreateInput = req.body;

    // Verify ownership
    const ownerCheck = await query(
      'SELECT id FROM properties WHERE id = $1 AND landlord_id = $2',
      [id, landlordId]
    );

    if (ownerCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found or access denied' },
      });
      return;
    }

    // Update property
    const result = await query(
      `UPDATE properties SET
        address = COALESCE($2, address),
        neighborhood = COALESCE($3, neighborhood),
        city = COALESCE($4, city),
        pincode = COALESCE($5, pincode),
        configuration = COALESCE($6, configuration),
        furnishing = COALESCE($7, furnishing),
        rent = COALESCE($8, rent),
        deposit = COALESCE($9, deposit),
        area = COALESCE($10, area),
        floor = COALESCE($11, floor),
        total_floors = COALESCE($12, total_floors),
        available_from = COALESCE($13, available_from),
        description = COALESCE($14, description),
        photos = COALESCE($15, photos),
        amenities = COALESCE($16, amenities),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id,
        input.address,
        input.neighborhood,
        input.city,
        input.pincode,
        input.configuration,
        input.furnishing,
        input.rent,
        input.deposit,
        input.area,
        input.floor,
        input.totalFloors,
        input.availableFrom,
        input.description,
        input.photos ? JSON.stringify(input.photos) : null,
        input.amenities ? JSON.stringify(input.amenities) : null,
      ]
    );

    res.status(200).json({
      success: true,
      data: { property: result.rows[0] },
      message: 'Property updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete property
 * DELETE /api/landlord/properties/:id
 */
export const deleteProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM properties WHERE id = $1 AND landlord_id = $2 RETURNING id',
      [id, landlordId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found or access denied' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update property status
 * PATCH /api/landlord/properties/:id/status
 */
export const updatePropertyStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'rented', 'maintenance', 'draft'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid status' },
      });
      return;
    }

    const result = await query(
      `UPDATE properties SET status = $3, updated_at = NOW()
       WHERE id = $1 AND landlord_id = $2
       RETURNING *`,
      [id, landlordId, status]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found or access denied' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { property: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get landlord's properties
 * GET /api/landlord/properties
 */
export const getLandlordProperties = async (
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
        p.*,
        COUNT(DISTINCT m.id) FILTER (WHERE m.tenant_swipe_direction = 'right') as match_count,
        COUNT(DISTINCT v.id) as viewing_count
       FROM properties p
       LEFT JOIN matches m ON p.id = m.property_id
       LEFT JOIN viewings v ON p.id = v.property_id
       WHERE p.landlord_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [landlordId]
    );

    res.status(200).json({
      success: true,
      data: {
        properties: result.rows.map((row: any) => ({
          ...row,
          matchCount: parseInt(row.match_count) || 0,
          viewCount: parseInt(row.view_count) || 0,
          inquiryCount: parseInt(row.inquiry_count) || 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get landlord dashboard stats
 * GET /api/landlord/stats
 */
export const getLandlordStats = async (
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

    // Get property counts
    const propertyCounts = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'available') as active_listings,
        COUNT(*) FILTER (WHERE status = 'rented') as rented,
        COUNT(*) as total
       FROM properties
       WHERE landlord_id = $1`,
      [landlordId]
    );

    // Get match counts (using matches table with tenant_swipe_direction)
    const matchCounts = await query(
      `SELECT COUNT(DISTINCT m.tenant_id) as total_matches
       FROM matches m
       JOIN properties p ON m.property_id = p.id
       WHERE p.landlord_id = $1 AND m.tenant_swipe_direction = 'right'`,
      [landlordId]
    );

    // Get viewing counts (using proposed/confirmed status from viewings table)
    const viewingCounts = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE v.status = 'proposed') as pending,
        COUNT(*) FILTER (WHERE v.status = 'confirmed') as confirmed,
        COUNT(*) as total
       FROM viewings v
       JOIN properties p ON v.property_id = p.id
       WHERE p.landlord_id = $1`,
      [landlordId]
    );

    // Get rating from landlord profile (response_rate not in schema, use rating instead)
    const profileResult = await query(
      'SELECT rating FROM landlord_profiles WHERE user_id = $1',
      [landlordId]
    );

    res.status(200).json({
      success: true,
      data: {
        activeListings: parseInt(propertyCounts.rows[0]?.active_listings) || 0,
        rentedProperties: parseInt(propertyCounts.rows[0]?.rented) || 0,
        totalMatches: parseInt(matchCounts.rows[0]?.total_matches) || 0,
        pendingViewings: parseInt(viewingCounts.rows[0]?.pending) || 0,
        confirmedViewings: parseInt(viewingCounts.rows[0]?.confirmed) || 0,
        responseRate: parseFloat(profileResult.rows[0]?.rating) * 20 || 0, // Convert 0-5 rating to percentage
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending tenant requests
 * GET /api/landlord/pending-requests
 */
export const getPendingRequests = async (
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
        v.proposed_datetime as datetime,
        v.status,
        v.tenant_notes as notes,
        p.id as property_id,
        p.address as property_address,
        p.neighborhood as property_neighborhood,
        u.id as tenant_id,
        u.name as tenant_name
       FROM viewings v
       JOIN properties p ON v.property_id = p.id
       JOIN users u ON v.tenant_id = u.id
       WHERE p.landlord_id = $1 AND v.status = 'proposed'
       ORDER BY v.created_at DESC
       LIMIT 10`,
      [landlordId]
    );

    res.status(200).json({
      success: true,
      data: {
        requests: result.rows.map((row: any) => {
          const dt = row.datetime ? new Date(row.datetime) : null;
          return {
            id: row.id,
            date: dt ? dt.toISOString().split('T')[0] : null,
            time: dt ? dt.toTimeString().slice(0, 5) : null,
            status: row.status,
            notes: row.notes,
            property: {
              id: row.property_id,
              address: row.property_address,
              neighborhood: row.property_neighborhood,
            },
            tenant: {
              id: row.tenant_id,
              name: row.tenant_name,
              photo: null,
            },
          };
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent matches
 * GET /api/landlord/recent-matches
 */
export const getRecentMatches = async (
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
        m.id,
        m.created_at as matched_at,
        m.match_score,
        p.id as property_id,
        p.address as property_address,
        p.neighborhood as property_neighborhood,
        u.id as tenant_id,
        u.name as tenant_name,
        tp.employment_status as tenant_occupation
       FROM matches m
       JOIN properties p ON m.property_id = p.id
       JOIN users u ON m.tenant_id = u.id
       LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
       WHERE p.landlord_id = $1 AND m.tenant_swipe_direction = 'right'
       ORDER BY m.created_at DESC
       LIMIT 10`,
      [landlordId]
    );

    res.status(200).json({
      success: true,
      data: {
        matches: result.rows.map((row: any) => ({
          id: row.id,
          matchedAt: row.matched_at,
          matchScore: row.match_score,
          property: {
            id: row.property_id,
            address: row.property_address,
            neighborhood: row.property_neighborhood,
          },
          tenant: {
            id: row.tenant_id,
            name: row.tenant_name,
            photo: null,
            occupation: row.tenant_occupation,
          },
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
