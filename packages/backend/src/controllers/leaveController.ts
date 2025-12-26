import { Request, Response } from 'express';
import pool from '../config/database';

export const getLeaveTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [leaveTypes] = await pool.execute(
      'SELECT * FROM leave_types WHERE tenant_id = ? AND is_active = true ORDER BY name',
      [tenantId]
    ) as any[];

    res.json({ leaveTypes });
  } catch (error) {
    console.error('Get leave types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLeaveBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [balances] = await pool.execute(
      `SELECT lb.*, lt.name as leave_type_name, lt.max_days 
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.user_id = ? AND lb.tenant_id = ? AND lb.year = ?`,
      [userId, tenantId, year]
    ) as any[];

    res.json({ balances });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const applyLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!leaveTypeId || !startDate || !endDate) {
      res.status(400).json({ error: 'Leave type, start date, and end date are required' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      res.status(400).json({ error: 'Start date must be before end date' });
      return;
    }

    // Calculate total days (excluding weekends)
    const totalDays = calculateWorkingDays(start, end);

    // Check leave type exists and get details
    const [leaveTypes] = await pool.execute(
      'SELECT * FROM leave_types WHERE id = ? AND tenant_id = ? AND is_active = true',
      [leaveTypeId, tenantId]
    ) as any[];

    if (leaveTypes.length === 0) {
      res.status(400).json({ error: 'Invalid leave type' });
      return;
    }

    const leaveType = leaveTypes[0];
    const year = start.getFullYear();

    // Check leave balance
    const [balances] = await pool.execute(
      'SELECT * FROM leave_balances WHERE user_id = ? AND leave_type_id = ? AND year = ?',
      [userId, leaveTypeId, year]
    ) as any[];

    let balance = balances[0];
    if (!balance) {
      // Create initial balance
      await pool.execute(
        'INSERT INTO leave_balances (user_id, tenant_id, leave_type_id, year, allocated_days) VALUES (?, ?, ?, ?, ?)',
        [userId, tenantId, leaveTypeId, year, leaveType.max_days]
      );
      balance = {
        allocated_days: leaveType.max_days,
        used_days: 0,
        pending_days: 0
      };
    }

    const availableDays = balance.allocated_days - balance.used_days - balance.pending_days;
    if (totalDays > availableDays) {
      res.status(400).json({ error: `Insufficient leave balance. Available: ${availableDays} days` });
      return;
    }

    // Create leave request
    const [result] = await pool.execute(
      `INSERT INTO leaves (user_id, tenant_id, leave_type_id, start_date, end_date, total_days, reason, status, applied_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [userId, tenantId, leaveTypeId, start, end, totalDays, reason || null, userId]
    ) as any;

    // Update pending days
    await pool.execute(
      'UPDATE leave_balances SET pending_days = pending_days + ? WHERE user_id = ? AND leave_type_id = ? AND year = ?',
      [totalDays, userId, leaveTypeId, year]
    );

    res.status(201).json({ 
      message: 'Leave application submitted successfully',
      leaveId: result.insertId
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [leaves] = await pool.execute(
      `SELECT l.*, lt.name as leave_type_name, 
       u1.first_name as applied_by_first_name, u1.last_name as applied_by_last_name,
       u2.first_name as approved_by_first_name, u2.last_name as approved_by_last_name,
       u3.first_name as rejected_by_first_name, u3.last_name as rejected_by_last_name
       FROM leaves l
       JOIN leave_types lt ON l.leave_type_id = lt.id
       JOIN users u1 ON l.applied_by = u1.id
       LEFT JOIN users u2 ON l.approved_by = u2.id
       LEFT JOIN users u3 ON l.rejected_by = u3.id
       WHERE l.user_id = ? AND l.tenant_id = ?
       ORDER BY l.created_at DESC`,
      [userId, tenantId]
    ) as any[];

    res.json({ leaves });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const status = req.query.status as string;

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let query = `SELECT l.*, lt.name as leave_type_name,
       u.first_name, u.last_name, u.email,
       u1.first_name as applied_by_first_name, u1.last_name as applied_by_last_name,
       u2.first_name as approved_by_first_name, u2.last_name as approved_by_last_name,
       u3.first_name as rejected_by_first_name, u3.last_name as rejected_by_last_name
       FROM leaves l
       JOIN leave_types lt ON l.leave_type_id = lt.id
       JOIN users u ON l.user_id = u.id
       JOIN users u1 ON l.applied_by = u1.id
       LEFT JOIN users u2 ON l.approved_by = u2.id
       LEFT JOIN users u3 ON l.rejected_by = u3.id
       WHERE l.tenant_id = ?`;

    const params: any[] = [tenantId];

    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }

    query += ' ORDER BY l.created_at DESC';

    const [leaves] = await pool.execute(query, params) as any[];

    res.json({ leaves });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const leaveId = parseInt(req.params.id);

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [leaves] = await pool.execute(
      'SELECT * FROM leaves WHERE id = ? AND tenant_id = ?',
      [leaveId, tenantId]
    ) as any[];

    if (leaves.length === 0) {
      res.status(404).json({ error: 'Leave not found' });
      return;
    }

    const leave = leaves[0];

    if (leave.status !== 'pending') {
      res.status(400).json({ error: `Leave is already ${leave.status}` });
      return;
    }

    const year = new Date(leave.start_date).getFullYear();

    // Update leave status
    await pool.execute(
      `UPDATE leaves SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [userId, leaveId]
    );

    // Update leave balance
    await pool.execute(
      `UPDATE leave_balances 
       SET used_days = used_days + ?, pending_days = pending_days - ?
       WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
      [leave.total_days, leave.total_days, leave.user_id, leave.leave_type_id, year]
    );

    res.json({ message: 'Leave approved successfully' });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const leaveId = parseInt(req.params.id);
    const { rejectionReason } = req.body;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [leaves] = await pool.execute(
      'SELECT * FROM leaves WHERE id = ? AND tenant_id = ?',
      [leaveId, tenantId]
    ) as any[];

    if (leaves.length === 0) {
      res.status(404).json({ error: 'Leave not found' });
      return;
    }

    const leave = leaves[0];

    if (leave.status !== 'pending') {
      res.status(400).json({ error: `Leave is already ${leave.status}` });
      return;
    }

    const year = new Date(leave.start_date).getFullYear();

    // Update leave status
    await pool.execute(
      `UPDATE leaves SET status = 'rejected', rejected_by = ?, rejected_at = NOW(), rejection_reason = ? WHERE id = ?`,
      [userId, rejectionReason || null, leaveId]
    );

    // Update leave balance - return pending days
    await pool.execute(
      `UPDATE leave_balances 
       SET pending_days = pending_days - ?
       WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
      [leave.total_days, leave.user_id, leave.leave_type_id, year]
    );

    res.json({ message: 'Leave rejected successfully' });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancelLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const leaveId = parseInt(req.params.id);

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [leaves] = await pool.execute(
      'SELECT * FROM leaves WHERE id = ? AND tenant_id = ? AND user_id = ?',
      [leaveId, tenantId, userId]
    ) as any[];

    if (leaves.length === 0) {
      res.status(404).json({ error: 'Leave not found' });
      return;
    }

    const leave = leaves[0];

    if (leave.status === 'cancelled') {
      res.status(400).json({ error: 'Leave is already cancelled' });
      return;
    }

    if (leave.status === 'approved') {
      res.status(400).json({ error: 'Cannot cancel an approved leave. Please contact admin.' });
      return;
    }

    const year = new Date(leave.start_date).getFullYear();

    // Update leave status
    await pool.execute(
      `UPDATE leaves SET status = 'cancelled' WHERE id = ?`,
      [leaveId]
    );

    // If pending, return pending days
    if (leave.status === 'pending') {
      await pool.execute(
        `UPDATE leave_balances 
         SET pending_days = pending_days - ?
         WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
        [leave.total_days, userId, leave.leave_type_id, year]
      );
    }

    res.json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLeaveReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : null;

    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let query = `SELECT l.*, lt.name as leave_type_name,
       u.first_name, u.last_name, u.email,
       u1.first_name as applied_by_first_name, u1.last_name as applied_by_last_name
       FROM leaves l
       JOIN leave_types lt ON l.leave_type_id = lt.id
       JOIN users u ON l.user_id = u.id
       JOIN users u1 ON l.applied_by = u1.id
       WHERE l.tenant_id = ?`;

    const params: any[] = [tenantId];

    if (userId) {
      query += ' AND l.user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      query += ' AND l.start_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND l.end_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY l.start_date DESC';

    const [leaves] = await pool.execute(query, params) as any[];

    // Calculate summary statistics
    const summary = {
      total: leaves.length,
      pending: leaves.filter((l: any) => l.status === 'pending').length,
      approved: leaves.filter((l: any) => l.status === 'approved').length,
      rejected: leaves.filter((l: any) => l.status === 'rejected').length,
      cancelled: leaves.filter((l: any) => l.status === 'cancelled').length,
      totalDays: leaves
        .filter((l: any) => l.status === 'approved')
        .reduce((sum: number, l: any) => sum + parseFloat(l.total_days), 0)
    };

    res.json({ leaves, summary });
  } catch (error) {
    console.error('Get leave report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to calculate working days (excluding weekends)
function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

