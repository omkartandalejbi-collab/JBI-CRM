import { Router } from 'express';
import {
  getAllUsers,
  getDepartmentTeam,
  createUser,
  updateUser,
  toggleUserStatus,
} from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles, blockCA } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.use(blockCA); // CA has zero access to users module

// HOD can see their own department team members
router.get('/department-team', requireRoles('HOD'), getDepartmentTeam);

// Admin-only user management routes
router.get('/', requireRoles('Admin'), getAllUsers);
router.post('/', requireRoles('Admin'), createUser);
router.put('/:id', requireRoles('Admin'), updateUser);
router.patch('/:id/toggle-status', requireRoles('Admin'), toggleUserStatus);

export default router;
