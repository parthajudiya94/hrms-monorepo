import { Request, Response } from 'express';
import pool from '../config/database';

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Check if there's an active session (clocked in but not clocked out)
    const [activeSession] = await pool.execute(
      'SELECT id FROM time_tracking WHERE user_id = ? AND date = ? AND clock_in_time IS NOT NULL AND clock_out_time IS NULL',
      [userId, today]
    ) as any[];

    if (activeSession.length > 0) {
      res.status(400).json({ error: 'You are already clocked in. Please clock out first.' });
      return;
    }

    // Allow multiple clock in/out cycles - create new clock in record
    await pool.execute(
      'INSERT INTO time_tracking (user_id, tenant_id, date, clock_in_time) VALUES (?, ?, ?, ?)',
      [userId, tenantId, today, now]
    );

    res.json({ message: 'Clocked in successfully', timestamp: now });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Find the active session (clocked in but not clocked out)
    const [activeSession] = await pool.execute(
      'SELECT id, clock_in_time, break_in_time, break_out_time FROM time_tracking WHERE user_id = ? AND date = ? AND clock_in_time IS NOT NULL AND clock_out_time IS NULL ORDER BY clock_in_time DESC LIMIT 1',
      [userId, today]
    ) as any[];

    if (activeSession.length === 0) {
      res.status(400).json({ error: 'No active session found. Please clock in first.' });
      return;
    }

    const session = activeSession[0];
    const clockInTime = new Date(session.clock_in_time);
    
    // Get total break hours (may have multiple breaks)
    let breakHours = parseFloat(session.total_break_hours) || 0;
    
    // If currently on break, add current break time
    if (session.break_in_time && !session.break_out_time) {
      const breakIn = new Date(session.break_in_time);
      const currentBreakHours = (now.getTime() - breakIn.getTime()) / (1000 * 60 * 60);
      breakHours += currentBreakHours;
    }
    
    // Calculate total work hours (time from clock in to clock out minus all break time)
    const totalTime = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    const totalWorkHours = Math.max(0, totalTime - breakHours);

    await pool.execute(
      `UPDATE time_tracking 
       SET clock_out_time = ?, total_work_hours = ?, total_break_hours = ? 
       WHERE id = ?`,
      [now, totalWorkHours, breakHours, session.id]
    );

    res.json({ 
      message: 'Clocked out successfully', 
      timestamp: now,
      totalWorkHours: totalWorkHours.toFixed(2)
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const breakIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Find the active session (clocked in but not clocked out)
    const [activeSession] = await pool.execute(
      'SELECT id, clock_in_time, break_in_time, break_out_time FROM time_tracking WHERE user_id = ? AND date = ? AND clock_in_time IS NOT NULL AND clock_out_time IS NULL ORDER BY clock_in_time DESC LIMIT 1',
      [userId, today]
    ) as any[];

    if (activeSession.length === 0) {
      res.status(400).json({ error: 'Please clock in first' });
      return;
    }

    const session = activeSession[0];

    // Check if already on break
    if (session.break_in_time && !session.break_out_time) {
      res.status(400).json({ error: 'Already on break. Please break out first' });
      return;
    }

    // Allow multiple breaks - set break in time
    await pool.execute(
      'UPDATE time_tracking SET break_in_time = ? WHERE id = ?',
      [now, session.id]
    );

    res.json({ message: 'Break started', timestamp: now });
  } catch (error) {
    console.error('Break in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const breakOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Find the active session with an active break
    const [activeSession] = await pool.execute(
      'SELECT id, break_in_time, break_out_time, total_break_hours FROM time_tracking WHERE user_id = ? AND date = ? AND clock_in_time IS NOT NULL AND clock_out_time IS NULL AND break_in_time IS NOT NULL AND break_out_time IS NULL ORDER BY clock_in_time DESC LIMIT 1',
      [userId, today]
    ) as any[];

    if (activeSession.length === 0) {
      res.status(400).json({ error: 'Not on break. Please break in first' });
      return;
    }

    const session = activeSession[0];
    const breakInTime = new Date(session.break_in_time);
    const breakHours = (now.getTime() - breakInTime.getTime()) / (1000 * 60 * 60);

    await pool.execute(
      'UPDATE time_tracking SET break_out_time = ?, total_break_hours = ? WHERE id = ?',
      [now, breakHours, session.id]
    );

    res.json({ message: 'Break ended', timestamp: now, breakHours: breakHours.toFixed(2) });
  } catch (error) {
    console.error('Break out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTodayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Get all records for today
    const [allRecords] = await pool.execute(
      `SELECT clock_in_time, clock_out_time, break_in_time, break_out_time, 
       total_work_hours, total_break_hours 
       FROM time_tracking 
       WHERE user_id = ? AND date = ?
       ORDER BY clock_in_time ASC`,
      [userId, today]
    ) as any[];

    if (allRecords.length === 0) {
      res.json({
        clockedIn: false,
        clockedOut: false,
        onBreak: false,
        clockInTime: null,
        clockOutTime: null,
        breakInTime: null,
        breakOutTime: null,
        totalWorkHours: 0,
        totalBreakHours: 0,
        sessionsCount: 0
      });
      return;
    }

    // Find the active session (most recent clock in without clock out)
    const activeSession = allRecords.find((r: any) => r.clock_in_time && !r.clock_out_time);
    
    // Calculate totals from all completed sessions (only count sessions that are clocked out)
    let totalWorkHours = 0;
    let totalBreakHours = 0;
    
    allRecords.forEach((record: any) => {
      if (record.clock_out_time) {
        // Only count completed sessions (clocked out)
        if (record.total_work_hours) {
          totalWorkHours += parseFloat(record.total_work_hours) || 0;
        }
        if (record.total_break_hours) {
          totalBreakHours += parseFloat(record.total_break_hours) || 0;
        }
      }
    });

    // If there's an active session (clocked in but not clocked out), calculate and add current work time
    if (activeSession) {
      const clockInTime = new Date(activeSession.clock_in_time);
      const now = new Date();
      
      // Get accumulated break hours from previous completed breaks in this active session
      let sessionBreakHours = parseFloat(activeSession.total_break_hours) || 0;
      
      // If currently on break, add current break time
      if (activeSession.break_in_time && !activeSession.break_out_time) {
        const breakIn = new Date(activeSession.break_in_time);
        const currentBreakHours = (now.getTime() - breakIn.getTime()) / (1000 * 60 * 60);
        sessionBreakHours += currentBreakHours;
      }
      
      // Calculate current session time (from clock in to now)
      const sessionTime = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      // Add current session work time (session time - all break time in this session)
      const currentSessionWorkHours = Math.max(0, sessionTime - sessionBreakHours);
      totalWorkHours += currentSessionWorkHours;
      totalBreakHours += sessionBreakHours;
    }
    
    // Always return totals, even if no active session (shows total for the day)
    
    // Always return totals, even if no active session (shows total for the day)

    const isOnBreak = activeSession && activeSession.break_in_time && !activeSession.break_out_time;

    res.json({
      clockedIn: !!activeSession,
      clockedOut: !activeSession && allRecords.length > 0,
      onBreak: isOnBreak,
      clockInTime: activeSession?.clock_in_time || null,
      clockOutTime: activeSession ? null : (allRecords[0]?.clock_out_time || null),
      breakInTime: activeSession?.break_in_time || null,
      breakOutTime: activeSession?.break_out_time || null,
      totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
      totalBreakHours: parseFloat(totalBreakHours.toFixed(2)),
      sessionsCount: allRecords.length
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Group by date and aggregate totals
    // If any session is still active (no clock_out_time), set clock_out_time to NULL
    let query = `SELECT 
                   date,
                   MIN(clock_in_time) as clock_in_time,
                   CASE 
                     WHEN SUM(CASE WHEN clock_out_time IS NULL THEN 1 ELSE 0 END) > 0 
                     THEN NULL 
                     ELSE MAX(clock_out_time) 
                   END as clock_out_time,
                   COALESCE(SUM(total_work_hours), 0) as total_work_hours,
                   COALESCE(SUM(total_break_hours), 0) as total_break_hours
                 FROM time_tracking
                 WHERE user_id = ? AND tenant_id = ?`;

    const params: any[] = [userId, tenantId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY date ORDER BY date DESC LIMIT 100';

    const [attendance] = await pool.execute(query, params) as any[];

    // Format the response
    const formattedAttendance = attendance.map((record: any) => ({
      date: record.date,
      clock_in_time: record.clock_in_time,
      clock_out_time: record.clock_out_time,
      total_work_hours: parseFloat(record.total_work_hours) || 0,
      total_break_hours: parseFloat(record.total_break_hours) || 0
    }));

    res.json({ attendance: formattedAttendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
