import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../prisma.js';
import { CONFIG } from '../../config/index.js';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Admin', 'HOD', 'Employee', 'CA']),
  department: z.string().nullable().optional(),
  phone: z.string().optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['Admin', 'HOD', 'Employee', 'CA']).optional(),
  department: z.string().nullable().optional(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

/**
 * Get all users with filters (Admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, department, search, isActive } = req.query;

    const where: any = {};
    if (role && typeof role === 'string' && role !== 'All') {
      where.role = role;
    }
    if (department && typeof department === 'string' && department !== 'All') {
      where.department = department;
    }
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        total: users.length,
        departments: CONFIG.DEPARTMENTS,
        roles: CONFIG.ROLES,
      },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

/**
 * Get team members for HOD (Scoped strictly to HOD's department)
 */
export const getDepartmentTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'HOD' || !req.user.department) {
      res.status(403).json({ success: false, message: 'Unauthorized access to department team.' });
      return;
    }

    const employees = await prisma.user.findMany({
      where: {
        department: req.user.department,
        role: 'Employee',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      department: req.user.department,
      data: employees,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch department team.' });
  }
};

/**
 * Create a new user (Admin only)
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const { name, email, password, role, phone } = parseResult.data;
    let { department } = parseResult.data;

    // Validate department requirements
    if (role === 'HOD' || role === 'Employee') {
      if (!department || !CONFIG.DEPARTMENTS.includes(department as any)) {
        res.status(400).json({
          success: false,
          message: `Department is required for role ${role}. Valid options: ${CONFIG.DEPARTMENTS.join(', ')}`,
        });
        return;
      }
    } else {
      // For Admin and CA, department must be null
      department = null;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
      return;
    }

    // Check HOD uniqueness per department: "There are 4 departments, each with one HOD"
    if (role === 'HOD' && department) {
      const existingHOD = await prisma.user.findFirst({
        where: {
          role: 'HOD',
          department: department,
          isActive: true,
        },
      });
      if (existingHOD) {
        res.status(400).json({
          success: false,
          message: `Department '${department}' already has an active HOD (${existingHOD.name}). Each department can have only one HOD.`,
        });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        department,
        phone: phone || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: newUser,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

/**
 * Update an existing user (Admin only)
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const data: any = { ...parseResult.data };

    // Format email if provided
    if (data.email) {
      data.email = data.email.toLowerCase().trim();
      const conflict = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (conflict) {
        res.status(400).json({ success: false, message: 'Email address already in use.' });
        return;
      }
    }

    const newRole = data.role || existingUser.role;
    let newDepartment = data.department !== undefined ? data.department : existingUser.department;

    if (newRole === 'Admin' || newRole === 'CA') {
      data.department = null;
      newDepartment = null;
    } else if (newRole === 'HOD' || newRole === 'Employee') {
      if (!newDepartment || !CONFIG.DEPARTMENTS.includes(newDepartment as any)) {
        res.status(400).json({
          success: false,
          message: `Department is required for role ${newRole}. Valid options: ${CONFIG.DEPARTMENTS.join(', ')}`,
        });
        return;
      }
    }

    // Check HOD uniqueness per department
    if (newRole === 'HOD' && newDepartment) {
      const existingHOD = await prisma.user.findFirst({
        where: {
          role: 'HOD',
          department: newDepartment,
          isActive: true,
          NOT: { id },
        },
      });
      if (existingHOD) {
        res.status(400).json({
          success: false,
          message: `Department '${newDepartment}' already has an active HOD (${existingHOD.name}).`,
        });
        return;
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

/**
 * Toggle user active/deactive status (Admin only)
 */
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (req.user?.id === user.id) {
      res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `User ${updated.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
  }
};
