import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow connections from frontend dev server
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'JBI CRM Backend',
    timestamp: new Date().toISOString(),
  });
});

// Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/billing', billingRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url} - Endpoint not found.`,
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
  });
});

export default app;
