import { Request, Response, NextFunction } from 'express';

/**
 * Request Logger Middleware
 * 
 * Logs all incoming requests with:
 * - HTTP method
 * - URL path
 * - Response status
 * - Response time
 * - User ID (if authenticated)
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as any).userId || 'anonymous';
    
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - User: ${userId}`
    );
  });
  
  next();
};
