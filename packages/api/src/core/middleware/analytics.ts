import { Request, Response, NextFunction } from 'express';
import { PostHog } from 'posthog-node';

/**
 * PostHog Analytics Middleware
 * 
 * Why PostHog?
 * - Open-source (self-hostable if needed)
 * - Free tier: 1M events/month
 * - Session replay (see what users do)
 * - Feature flags (A/B testing)
 * - Funnels and retention analysis
 */

// Initialize PostHog client
const posthogClient = process.env.POSTHOG_API_KEY
  ? new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
    })
  : null;

/**
 * Track API request in PostHog
 */
export const analyticsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip if PostHog not configured
  if (!posthogClient) {
    next();
    return;
  }
  
  // Get user ID if authenticated
  const userId = (req as any).userId || `anonymous-${req.ip}`;
  
  // Track on response finish
  res.on('finish', () => {
    posthogClient.capture({
      distinctId: userId,
      event: 'api_request',
      properties: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      },
    });
  });
  
  next();
};

// Export for use in other parts of the app
export const analytics = posthogClient;
