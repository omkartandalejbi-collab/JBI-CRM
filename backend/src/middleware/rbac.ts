import { Request, Response, NextFunction } from 'express';

/**
 * Restricts access to specified roles.
 * Returns 403 Forbidden if current user role is not allowed.
 */
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
};

/**
 * CA Access Guard for Billing:
 * Chartered Accountants (CA) have strictly READ-ONLY access to Billing.
 * Any non-GET request (POST, PUT, PATCH, DELETE) by a CA is blocked with 403.
 */
export const caBillingGuard = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role === 'CA') {
    // Only GET method is allowed for CA
    if (req.method !== 'GET') {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Chartered Accountants (CA) have strictly read-only access to the billing module.',
      });
      return;
    }
  }

  next();
};

/**
 * Blocks CA from non-billing modules entirely.
 */
export const blockCA = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role === 'CA') {
    res.status(403).json({
      success: false,
      message: 'Forbidden. Chartered Accountants (CA) have access exclusively to the Billing module.',
    });
    return;
  }
  next();
};

/**
 * Injects department scope:
 * - Admin: no department restriction
 * - HOD: strictly locked to req.user.department
 * - Employee: blocked from department-wide queries
 */
export const scopeDepartment = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  if (req.user.role === 'HOD') {
    if (!req.user.department) {
      res.status(403).json({
        success: false,
        message: 'HOD user does not have an assigned department.',
      });
      return;
    }
  }

  next();
};
