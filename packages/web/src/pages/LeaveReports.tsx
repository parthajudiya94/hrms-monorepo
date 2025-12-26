import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getLeaveReport, Leave } from '../services/leaveService';
import './LeaveReports.css';

const LeaveReports: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();
  const user = getCurrentUser();
  const hasLoadedRef = useRef(false);
  const startDateRef = useRef('');
  const endDateRef = useRef('');

  // Keep refs in sync with state
  useEffect(() => {
    startDateRef.current = startDate;
  }, [startDate]);

  useEffect(() => {
    endDateRef.current = endDate;
  }, [endDate]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLeaveReport(
        startDateRef.current || undefined,
        endDateRef.current || undefined
      );
      setLeaves(data.leaves);
      setSummary(data.summary);
    } catch (err) {
      setError('Failed to load leave report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      history.push('/login');
      return;
    }
    
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadReport();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  if (!user) return null;

  return (
    <div className="leave-reports-container">
      <div className="leave-reports-header">
        <h1>Leave Reports</h1>
      </div>

      <div className="report-filters">
        <form onSubmit={handleFilter} className="filter-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
            <div className="form-group">
              <button type="submit" className="filter-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Filter'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  loadReport();
                }}
                className="clear-btn"
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>

      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Leaves</h3>
            <p className="summary-value">{summary.total}</p>
          </div>
          <div className="summary-card approved">
            <h3>Approved</h3>
            <p className="summary-value">{summary.approved}</p>
          </div>
          <div className="summary-card pending">
            <h3>Pending</h3>
            <p className="summary-value">{summary.pending}</p>
          </div>
          <div className="summary-card rejected">
            <h3>Rejected</h3>
            <p className="summary-value">{summary.rejected}</p>
          </div>
          <div className="summary-card cancelled">
            <h3>Cancelled</h3>
            <p className="summary-value">{summary.cancelled}</p>
          </div>
          <div className="summary-card days">
            <h3>Total Days</h3>
            <p className="summary-value">{summary.totalDays.toFixed(1)}</p>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="empty-state">
          <p>No leave records found for the selected period.</p>
        </div>
      ) : (
        <div className="leaves-table-container">
          <table className="leaves-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Applied On</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td>
                    {leave.first_name} {leave.last_name}
                    <br />
                    <small>{leave.email}</small>
                  </td>
                  <td>{leave.leave_type_name}</td>
                  <td>{formatDate(leave.start_date)}</td>
                  <td>{formatDate(leave.end_date)}</td>
                  <td>{leave.total_days}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(leave.status)}`}>
                      {leave.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="reason-cell">{leave.reason || '-'}</td>
                  <td>{formatDate(leave.created_at || '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveReports;

