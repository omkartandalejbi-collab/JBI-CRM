import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'jbi_crm_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  DEPARTMENTS: ['Engineering', 'Sales', 'Marketing', 'Operations'] as const,
  ROLES: ['Admin', 'HOD', 'Employee', 'CA'] as const,
};

export type DepartmentType = typeof CONFIG.DEPARTMENTS[number];
export type RoleType = typeof CONFIG.ROLES[number];
