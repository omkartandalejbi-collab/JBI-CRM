import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getMyTodayStatus,
  getMyAttendance,
  getDepartmentAttendance,
  getAllAttendance,
} from './attendance.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles, blockCA } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.use(blockCA); // Block Chartered Accountants from Attendance module completely

// Employee & all staff self-attendance
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today-status', getMyTodayStatus);
router.get('/my-attendance', getMyAttendance);

// HOD-only department attendance (scoped to HOD department)
router.get('/department', requireRoles('HOD'), getDepartmentAttendance);

// Admin-only all-department attendance
router.get('/all', requireRoles('Admin'), getAllAttendance);

export default router;
