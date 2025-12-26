import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Row, Col, Statistic, Button, Space, Alert, Avatar, Typography, Empty } from 'antd';
import { ClockCircleOutlined, PauseCircleOutlined, PlayCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import { getCurrentUser } from '../services/authService';
import {
  clockIn,
  clockOut,
  breakIn,
  breakOut,
  getTodayStatus,
} from '../services/timeTrackingService';
import { getMyLeaves } from '../services/leaveService';
import api from '../services/api';
import { TimeTrackingStatus } from '../types';
import './Dashboard.css';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<TimeTrackingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState(getCurrentUser());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workingHours, setWorkingHours] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [breakHours, setBreakHours] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  const history = useHistory();

  const loadStatus = useCallback(async () => {
    try {
      const data = await getTodayStatus();
      setStatus(data);
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.error || 'Failed to load status');
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const leaveData = await getMyLeaves();
      const pendingLeaves = leaveData.leaves.filter((l: any) => l.status === 'pending').length;
      const approvedLeaves = leaveData.leaves.filter((l: any) => l.status === 'approved').length;
      
      let userCount = 0;
      if (user && (user.roleName === 'Admin' || user.roleName === 'HR')) {
        try {
          const userResponse = await api.get('/users');
          userCount = userResponse.data.users?.length || 0;
        } catch (err) {
          // Ignore if not authorized
        }
      }

      setStats({
        pendingLeaves,
        approvedLeaves,
        totalLeaves: leaveData.leaves.length,
        userCount
      });
    } catch (err) {
      // Silently fail for stats
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      history.push('/login');
      return;
    }

    // Initial load only once
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      loadStatus();
      loadStats();
    }

    // Set up intervals for periodic updates
    const statusInterval = setInterval(() => {
      loadStatus();
      loadStats();
    }, 60000); // Refresh every minute

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(timeInterval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Calculate total accumulated time for the day (all sessions)
    // Always show total time, even when clocked out or after break out
    if (status) {
      const now = new Date();
      
      // Start with totals from backend (includes all completed sessions)
      let totalWorkSeconds = Math.floor((status.totalWorkHours || 0) * 3600);
      let totalBreakSeconds = Math.floor((status.totalBreakHours || 0) * 3600);
      
      // If currently clocked in, update in real-time for accurate second-by-second display
      if (status.clockedIn && status.clockInTime) {
        const clockInTime = new Date(status.clockInTime);
        const sessionSeconds = Math.floor((now.getTime() - clockInTime.getTime()) / 1000);
        
        // Calculate break time in current active session
        let activeSessionBreakSeconds = 0;
        
        // Get completed breaks in this session
        if (status.breakInTime && status.breakOutTime) {
          const breakIn = new Date(status.breakInTime);
          const breakOut = new Date(status.breakOutTime);
          activeSessionBreakSeconds = Math.floor((breakOut.getTime() - breakIn.getTime()) / 1000);
        }
        
        // If currently on break, add current break time
        if (status.onBreak && status.breakInTime) {
          const breakIn = new Date(status.breakInTime);
          const currentBreakSeconds = Math.floor((now.getTime() - breakIn.getTime()) / 1000);
          totalBreakSeconds = Math.floor((status.totalBreakHours || 0) * 3600) + currentBreakSeconds;
          activeSessionBreakSeconds += currentBreakSeconds;
        } else {
          // Not on break, use backend total (includes completed breaks from active session)
          totalBreakSeconds = Math.floor((status.totalBreakHours || 0) * 3600);
        }
        
        // Recalculate work time for active session: session time - all break time
        const activeSessionWorkSeconds = Math.max(0, sessionSeconds - activeSessionBreakSeconds);
        
        // Total work = completed sessions work + active session work (real-time)
        // Backend totalWorkHours includes active session estimate
        // We replace with real-time calculation
        const backendActiveWorkEstimate = Math.max(0, 
          sessionSeconds - Math.floor((status.totalBreakHours || 0) * 3600)
        );
        const completedSessionsWork = Math.max(0, Math.floor((status.totalWorkHours || 0) * 3600) - backendActiveWorkEstimate);
        totalWorkSeconds = completedSessionsWork + activeSessionWorkSeconds;
      }
      // If clocked out, backend totals are final - just display them (already set above)

      const workingHrs = Math.floor(totalWorkSeconds / 3600);
      const workingMins = Math.floor((totalWorkSeconds % 3600) / 60);
      const workingSecs = totalWorkSeconds % 60;

      const breakHrs = Math.floor(totalBreakSeconds / 3600);
      const breakMins = Math.floor((totalBreakSeconds % 3600) / 60);
      const breakSecs = totalBreakSeconds % 60;

      setWorkingHours({ hours: workingHrs, minutes: workingMins, seconds: workingSecs });
      setBreakHours({ hours: breakHrs, minutes: breakMins, seconds: breakSecs });
    } else {
      // If no status, show zeros
      setWorkingHours({ hours: 0, minutes: 0, seconds: 0 });
      setBreakHours({ hours: 0, minutes: 0, seconds: 0 });
    }
  }, [status, currentTime]);

  const handleClockIn = async () => {
    setLoading(true);
    setError('');
    try {
      await clockIn();
      loadStatus();
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.error || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setError('');
    try {
      await clockOut();
      await loadStatus();
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.error || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakIn = async () => {
    setLoading(true);
    setError('');
    try {
      await breakIn();
      await loadStatus();
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.error || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakOut = async () => {
    setLoading(true);
    setError('');
    try {
      await breakOut();
      await loadStatus();
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.error || 'Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (time: { hours: number; minutes: number; seconds: number }) => {
    return `${String(time.hours).padStart(2, '0')} : ${String(time.minutes).padStart(2, '0')} : ${String(time.seconds).padStart(2, '0')}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Title level={2} style={{ marginBottom: 24 }}>Dashboard</Title>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[24, 24]}>
        {/* Left Column - Main Content */}
        <Col xs={24} lg={16}>
          <Row gutter={[24, 24]}>
            {/* Time Log Card */}
            <Col xs={24}>
              <Card title="Time Log" extra={<Text type="secondary">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>}>
                <div className="time-log-placeholder">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Time tracking chart will be displayed here"
                  />
                </div>
              </Card>
            </Col>

            {/* My Leave & Holiday Cards */}
            <Col xs={24} sm={12}>
              <Card title="My Leave">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No Leaves found for the month"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card title="Upcoming Holiday">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No upcoming holiday for the month"
                />
              </Card>
            </Col>

            {/* Stats Card */}
            {stats && (
              <Col xs={24}>
                <Card title="Quick Statistics">
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                      <Statistic title="Pending Leaves" value={stats.pendingLeaves} valueStyle={{ color: '#faad14' }} />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic title="Approved Leaves" value={stats.approvedLeaves} valueStyle={{ color: '#52c41a' }} />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic title="Total Leaves" value={stats.totalLeaves} />
                    </Col>
                    {(user?.roleName === 'Admin' || user?.roleName === 'HR') && (
                      <Col xs={12} sm={6}>
                        <Statistic title="Total Users" value={stats.userCount} />
                      </Col>
                    )}
                  </Row>
                </Card>
              </Col>
            )}
          </Row>
        </Col>

        {/* Right Column - Timing & Profile */}
        <Col xs={24} lg={8}>
          <Row gutter={[24, 24]}>
            {/* User Profile */}
            <Col xs={24}>
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
                  <Avatar size={80} style={{ backgroundColor: '#805ad5' }}>
                    {getInitials(user.firstName, user.lastName)}
                  </Avatar>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>{user.firstName} {user.lastName}</Title>
                    <Text type="secondary">{user.roleName}</Text>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* My Timing Card */}
            <Col xs={24}>
              <Card title="My Timing">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div className="timing-display">
                    <div className="timing-box">
                      <Text type="secondary" style={{ fontSize: 12 }}>Current Time</Text>
                      <div className="timing-value working-time">
                        {formatTimer(workingHours)}
                      </div>
                    </div>
                    <div className="timing-box">
                      <Text type="secondary" style={{ fontSize: 12 }}>Break Time</Text>
                      <div className="timing-value break-time">
                        {formatTimer(breakHours)}
                      </div>
                    </div>
                  </div>
                  <div className="timing-actions">
                    {!status?.clockedIn && (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={handleClockIn}
                        disabled={loading}
                        block
                        size="large"
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                      >
                        CLOCK IN
                      </Button>
                    )}
                    {status?.clockedIn && !status?.onBreak && (
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Button
                          danger
                          icon={<LogoutOutlined />}
                          onClick={handleClockOut}
                          disabled={loading}
                          block
                          size="large"
                        >
                          CLOCK OUT
                        </Button>
                        <Button
                          icon={<PauseCircleOutlined />}
                          onClick={handleBreakIn}
                          disabled={loading}
                          block
                          size="large"
                          style={{ background: '#faad14', borderColor: '#faad14', color: 'white' }}
                        >
                          BREAK IN
                        </Button>
                      </Space>
                    )}
                    {status?.onBreak && (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={handleBreakOut}
                        disabled={loading}
                        block
                        size="large"
                        style={{ background: '#1890ff', borderColor: '#1890ff' }}
                      >
                        BREAK OUT
                      </Button>
                    )}
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Attendance Calendar */}
            <Col xs={24}>
              <Card title="Attendance Calendar">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Calendar view will be displayed here"
                  style={{ padding: '20px 0' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
