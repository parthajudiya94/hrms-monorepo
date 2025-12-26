import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Table, DatePicker, Button, Space, Typography, message, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getCurrentUser } from '../services/authService';
import api from '../services/api';
import './Attendance.css';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface AttendanceRecord {
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  total_work_hours: number;
  total_break_hours: number;
}

const Attendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const user = getCurrentUser();
  const hasLoadedRef = useRef(false);
  const dateRangeRef = useRef<[Dayjs | null, Dayjs | null] | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  const loadAttendance = useCallback(async (customDateRange?: [Dayjs | null, Dayjs | null] | null) => {
    setLoading(true);
    try {
      const params: any = {};
      // Use the parameter if provided, otherwise use ref to get current value
      const rangeToUse = customDateRange !== undefined ? customDateRange : dateRangeRef.current;
      
      if (rangeToUse && rangeToUse[0]) {
        params.startDate = rangeToUse[0].format('YYYY-MM-DD');
      }
      if (rangeToUse && rangeToUse[1]) {
        params.endDate = rangeToUse[1].format('YYYY-MM-DD');
      }
      
      const response = await api.get('/time-tracking/attendance', { params });
      setAttendance(response.data.attendance || []);
    } catch (err) {
      const error = err as any;
      message.error(error.response?.data?.error || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      history.push('/login');
      return;
    }
    
    // Only load once on mount
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = useCallback(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleClear = useCallback(async () => {
    setDateRange(null);
    // Reload without filters
    await loadAttendance(null);
  }, [loadAttendance]);

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format('MMM DD, YYYY');
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    return dayjs(timeStr).format('hh:mm A');
  };

  const getStatusTag = useCallback((record: AttendanceRecord) => {
    if (record.clock_in_time && !record.clock_out_time) {
      return <Tag color="processing">Active</Tag>;
    } else if (record.clock_in_time && record.clock_out_time) {
      return <Tag color="success">Complete</Tag>;
    } else {
      return <Tag color="default">Absent</Tag>;
    }
  }, []);

  const columns = useMemo(() => [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDate(date),
      sorter: (a: AttendanceRecord, b: AttendanceRecord) => 
        dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Clock In',
      dataIndex: 'clock_in_time',
      key: 'clock_in_time',
      render: (time: string | null) => formatTime(time),
    },
    {
      title: 'Clock Out',
      dataIndex: 'clock_out_time',
      key: 'clock_out_time',
      render: (time: string | null) => formatTime(time),
    },
    {
      title: 'Work Hours',
      dataIndex: 'total_work_hours',
      key: 'total_work_hours',
      render: (hours: number) => `${hours.toFixed(2)} hrs`,
      sorter: (a: AttendanceRecord, b: AttendanceRecord) => 
        a.total_work_hours - b.total_work_hours,
    },
    {
      title: 'Break Hours',
      dataIndex: 'total_break_hours',
      key: 'total_break_hours',
      render: (hours: number) => `${hours.toFixed(2)} hrs`,
      sorter: (a: AttendanceRecord, b: AttendanceRecord) => 
        a.total_break_hours - b.total_break_hours,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: AttendanceRecord) => getStatusTag(record),
    },
  ], [getStatusTag]);

  if (!user) return null;

  return (
    <div className="attendance-container">
      <Card>
        <Title level={2} style={{ marginBottom: '24px' }}>
          Attendance Records
        </Title>

        <Card style={{ marginBottom: '24px' }}>
          <Space size="middle" wrap>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
              format="YYYY-MM-DD"
              style={{ width: '300px' }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleFilter}
              loading={loading}
            >
              Filter
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </Button>
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={attendance}
          rowKey={(record, index) => `${record.date}-${index}`}
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
          }}
          locale={{
            emptyText: 'No attendance records found for the selected period.',
          }}
        />
      </Card>
    </div>
  );
};

export default Attendance;

