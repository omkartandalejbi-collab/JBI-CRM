import { Request, Response } from 'express';
import prisma from '../../prisma.js';

/**
 * Returns formatted server date in 'YYYY-MM-DD'
 */
const getServerDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Employee Check-In
 * - Uses SERVER time
 * - Enforces strictly one check-in per day per employee
 */
export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const today = getServerDate();
    const serverTimestamp = new Date();

    // Check if employee already marked attendance today
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: req.user.id,
          date: today,
        },
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Duplicate check-in blocked. You have already checked in today.',
        data: existing,
      });
      return;
    }

    const record = await prisma.attendance.create({
      data: {
        userId: req.user.id,
        date: today,
        checkIn: serverTimestamp,
        status: 'Present',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Checked in successfully at ${serverTimestamp.toLocaleTimeString()} (Server Time).`,
      data: record,
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Failed to record check-in.' });
  }
};

/**
 * Employee Check-Out
 * - Uses SERVER time
 * - Validates check-in exists and check-out not already marked
 */
export const checkOut = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const today = getServerDate();
    const serverTimestamp = new Date();

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: req.user.id,
          date: today,
        },
      },
    });

    if (!existing) {
      res.status(400).json({
        success: false,
        message: 'Cannot check out before checking in for today.',
      });
      return;
    }

    if (existing.checkOut) {
      res.status(400).json({
        success: false,
        message: 'You have already checked out today.',
        data: existing,
      });
      return;
    }

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: serverTimestamp,
        status: 'Completed',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Checked out successfully at ${serverTimestamp.toLocaleTimeString()} (Server Time).`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Failed to record check-out.' });
  }
};

/**
 * Get today's attendance status for logged-in user
 */
export const getMyTodayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const today = getServerDate();
    const record = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: req.user.id,
          date: today,
        },
      },
    });

    res.status(200).json({
      success: true,
      today,
      record: record || null,
      isCheckedIn: !!record,
      isCheckedOut: !!record?.checkOut,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch status.' });
  }
};

/**
 * Employee view: sees own attendance history only
 */
export const getMyAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const { month, date } = req.query;
    const where: any = { userId: req.user.id };

    if (date && typeof date === 'string') {
      where.date = date;
    } else if (month && typeof month === 'string') {
      where.date = { startsWith: month }; // 'YYYY-MM'
    }

    const history = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance history.' });
  }
};

/**
 * HOD View: Sees attendance of employees in their own department only
 * With date and employee filter.
 */
export const getDepartmentAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'HOD' || !req.user.department) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only HODs can access department attendance.',
      });
      return;
    }

    const { date, month, employeeId } = req.query;

    const where: any = {
      user: {
        department: req.user.department,
      },
    };

    if (employeeId && typeof employeeId === 'string' && employeeId !== 'All') {
      where.userId = employeeId;
    }

    if (date && typeof date === 'string') {
      where.date = date;
    } else if (month && typeof month === 'string') {
      where.date = { startsWith: month };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
    });

    res.status(200).json({
      success: true,
      department: req.user.department,
      data: records,
    });
  } catch (error: any) {
    console.error('Department attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch department attendance.' });
  }
};

/**
 * Admin View: Sees attendance across all employees and all departments
 * With department, employee, and date filters.
 */
export const getAllAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Admin role required.',
      });
      return;
    }

    const { department, employeeId, date, month } = req.query;

    const where: any = {};

    if (department && typeof department === 'string' && department !== 'All') {
      where.user = { department };
    }

    if (employeeId && typeof employeeId === 'string' && employeeId !== 'All') {
      where.userId = employeeId;
    }

    if (date && typeof date === 'string') {
      where.date = date;
    } else if (month && typeof month === 'string') {
      where.date = { startsWith: month };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
    });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    console.error('Admin attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.' });
  }
};
