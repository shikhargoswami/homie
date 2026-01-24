/**
 * Landlord Verification Controller
 * 
 * Endpoints:
 * - GET /api/landlord/verification/status - Get verification status
 * - POST /api/landlord/verification/email/send - Send email verification OTP
 * - POST /api/landlord/verification/email/verify - Verify email OTP
 * - POST /api/landlord/verification/id - Submit ID for verification
 * - POST /api/landlord/verification/property-docs - Submit property documents
 * - POST /api/landlord/verification/skip - Skip verification for now
 * - GET /api/landlord/verification/badges - Get verification badges
 */

import { Request, Response, NextFunction } from 'express';
import { landlordVerificationService } from '../services/landlord-verification.service';

/**
 * Get landlord's verification status
 * GET /api/landlord/verification/status
 */
export const getVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId!;

    const status = await landlordVerificationService.getVerificationStatus(landlordId);

    if (!status) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Landlord profile not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { verification: status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send email verification OTP
 * POST /api/landlord/verification/email/send
 * Body: { email: string }
 */
export const sendEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId!;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' },
      });
      return;
    }

    const result = await landlordVerificationService.sendEmailVerificationOtp({
      email,
      landlordId,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VERIFICATION_ERROR', message: result.message },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: result.message },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email OTP
 * POST /api/landlord/verification/email/verify
 * Body: { otp: string }
 */
export const verifyEmailOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId!;
    const { otp } = req.body;

    if (!otp) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'OTP is required' },
      });
      return;
    }

    const result = await landlordVerificationService.verifyEmailOtp(landlordId, otp);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VERIFICATION_ERROR', message: result.message },
      });
      return;
    }

    // Get updated status
    const status = await landlordVerificationService.getVerificationStatus(landlordId);

    res.status(200).json({
      success: true,
      data: { 
        message: result.message,
        verification: status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit ID for verification
 * POST /api/landlord/verification/id
 * Body: { documentType: string, documentNumber: string, documentImageUrl?: string }
 */
export const submitIdVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId!;
    const { documentType, documentNumber, documentImageUrl } = req.body;

    if (!documentType || !documentNumber) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Document type and number are required' },
      });
      return;
    }

    const validTypes = ['aadhar', 'pan', 'passport', 'driving_license'];
    if (!validTypes.includes(documentType)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid document type' },
      });
      return;
    }

    const result = await landlordVerificationService.submitIdVerification({
      landlordId,
      documentType,
      documentNumber,
      documentImageUrl,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VERIFICATION_ERROR', message: result.message },
      });
      return;
    }

    // Get updated status
    const status = await landlordVerificationService.getVerificationStatus(landlordId);

    res.status(200).json({
      success: true,
      data: { 
        message: result.message,
        verificationId: result.verificationId,
        verification: status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit property ownership documents
 * POST /api/landlord/verification/property-docs
 * Body: { documentUrls: string[], documentType: string }
 */
export const submitPropertyDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId!;
    const { documentUrls, documentType } = req.body;

    if (!documentUrls || !Array.isArray(documentUrls) || documentUrls.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Document URLs are required' },
      });
      return;
    }

    const result = await landlordVerificationService.submitPropertyDocuments({
      landlordId,
      documentUrls,
      documentType,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VERIFICATION_ERROR', message: result.message },
      });
      return;
    }

    // Get updated status
    const status = await landlordVerificationService.getVerificationStatus(landlordId);

    res.status(200).json({
      success: true,
      data: { 
        message: result.message,
        verification: status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Skip verification for now
 * POST /api/landlord/verification/skip
 */
export const skipVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId!;

    await landlordVerificationService.skipVerification(landlordId);

    res.status(200).json({
      success: true,
      data: { message: 'Verification skipped. You can complete it anytime from Settings.' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification badges
 * GET /api/landlord/verification/badges
 */
export const getVerificationBadges = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId!;

    const badges = await landlordVerificationService.getVerificationBadges(landlordId);

    res.status(200).json({
      success: true,
      data: { badges },
    });
  } catch (error) {
    next(error);
  }
};
