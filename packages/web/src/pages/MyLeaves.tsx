import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getMyLeaves, cancelLeave, Leave } from '../services/leaveService';
import './MyLeaves.css';

const MyLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const history = useHistory();
  const user = getCurrentUser();
  const hasLoadedRef = useRef(false);

  const loadLeaves = useCallback(async () => {
    try {
      const data = await getMyLeaves();
      setLeaves(data.leaves);
    } catch (err) {
      setError('Failed to load leaves');
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
      loadLeaves();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (leaveId: number) => {
    if (!window.confirm('Are you sure you want to cancel this leave?')) {
      return;
    }

    try {
      await cancelLeave(leaveId);
      await loadLeaves();
    } catch (err) {
      const error = err as any;
      alert(error.response?.data?.error || 'Failed to cancel leave');
    }
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user) return null;

  return (
    <div className="my-leaves-container">
      <div className="my-leaves-header">
        <h1>My Leaves</h1>
        <button
          onClick={() => history.push('/apply-leave')}
          className="apply-leave-btn"
        >
          Apply for Leave
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="empty-state">
          <p>No leave applications found.</p>
          <button
            onClick={() => history.push('/apply-leave')}
            className="apply-leave-btn"
          >
            Apply for Leave
          </button>
        </div>
      ) : (
        <div className="leaves-table-container">
          <table className="leaves-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Applied On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
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
                  <td>{formatDate(leave.created_at)}</td>
                  <td>
                    {leave.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(leave.id)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    )}
                    {leave.status === 'rejected' && leave.rejection_reason && (
                      <span className="rejection-reason" title={leave.rejection_reason}>
                        View Reason
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;

