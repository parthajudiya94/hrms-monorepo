import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { JwtPayload } from '../types';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const [users] = await pool.execute(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ? AND u.is_active = true',
      [email]
    ) as any[];

    if (users.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const payload: JwtPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      roleId: user.role_id,
      email: user.email
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roleId: user.role_id,
        roleName: user.role_name,
        tenantId: user.tenant_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, tenantId, roleId } = req.body;

    if (!email || !password || !firstName || !lastName || !tenantId || !roleId) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Check if user already exists
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
        tenantId: newUser[0].tenant_id
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

