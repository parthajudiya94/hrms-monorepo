import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, roleId } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!email || !password || !firstName || !lastName || !roleId) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Check if user already exists in this tenant
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ?',
      [email, tenantId]
    ) as any[];

    if (existingUsers.length > 0) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Verify role belongs to tenant
    const [roles] = await pool.execute(
      'SELECT id FROM roles WHERE id = ? AND tenant_id = ?',
      [roleId, tenantId]
    ) as any[];

    if (roles.length === 0) {
      res.status(400).json({ error: 'Invalid role for this tenant' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (tenant_id, role_id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
      [tenantId, roleId, email, passwordHash, firstName, lastName]
    ) as any;

    const [newUser] = await pool.execute(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        firstName: newUser[0].first_name,
        lastName: newUser[0].last_name,
        roleId: newUser[0].role_id,
        roleName: newUser[0].role_name,
        tenantId: newUser[0].tenant_id,
        isActive: newUser[0].is_active
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.created_at, 
       r.id as role_id, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.tenant_id = ? 
       ORDER BY u.created_at DESC`,
      [tenantId]
    ) as any[];

    res.json({
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        roleId: u.role_id,
        roleName: u.role_name,
        isActive: u.is_active,
        createdAt: u.created_at
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [roles] = await pool.execute(
      'SELECT id, name, description, is_system_role FROM roles WHERE tenant_id = ? ORDER BY name',
      [tenantId]
    ) as any[];

    res.json({
      roles: roles.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystemRole: r.is_system_role
      }))
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

