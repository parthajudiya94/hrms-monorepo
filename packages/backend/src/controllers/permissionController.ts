import { Request, Response } from 'express';
import pool from '../config/database';

export const getPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [permissions] = await pool.execute(
      'SELECT * FROM permissions WHERE tenant_id = ? ORDER BY resource, action',
      [tenantId]
    ) as any[];

    res.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, description, resource, action } = req.body;

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name || !resource || !action) {
      res.status(400).json({ error: 'Name, resource, and action are required' });
      return;
    }

    const [result] = await pool.execute(
      'INSERT INTO permissions (tenant_id, name, description, resource, action) VALUES (?, ?, ?, ?, ?)',
      [tenantId, name, description || null, resource, action]
    ) as any;

    res.status(201).json({ message: 'Permission created successfully', permissionId: result.insertId });
  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRolePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const roleId = parseInt(req.params.roleId);

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [permissions] = await pool.execute(
      `SELECT p.*, rp.id as role_permission_id
       FROM permissions p
       LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = ?
       WHERE p.tenant_id = ?
       ORDER BY p.resource, p.action`,
      [roleId, tenantId]
    ) as any[];

    res.json({ permissions });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRolePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const roleId = parseInt(req.params.roleId);
    const { permissionIds } = req.body;

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify role belongs to tenant
    const [roles] = await pool.execute(
      'SELECT id FROM roles WHERE id = ? AND tenant_id = ?',
      [roleId, tenantId]
    ) as any[];

    if (roles.length === 0) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // Remove all existing permissions for this role
    await pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

    // Add new permissions
    if (permissionIds && permissionIds.length > 0) {
      const values = permissionIds.map((pid: number) => [roleId, pid]);
      for (const [rId, pId] of values) {
        await pool.execute(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [rId, pId]
        );
      }
    }

    res.json({ message: 'Role permissions updated successfully' });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

