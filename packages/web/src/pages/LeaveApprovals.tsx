import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getAllLeaves, approveLeave, rejectLeave, Leave } from '../services/leaveService';
import './LeaveApprovals.css';

const LeaveApprovals: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: number]: string }>({});
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const history = useHistory();
  const user = getCurrentUser();
  const filterRef = useRef(filter);

  // Keep ref in sync with state
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const loadLeaves = useCallback(async () => {
    try {
      const currentFilter = filterRef.current;
      const status = currentFilter === 'all' ? undefined : currentFilter;
      const data = await getAllLeaves(status);
      setLeaves(data.leaves);
    } catch (err) {
      setError('Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      history.push('/login');
      return;
    }
    loadLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleApprove = async (leaveId: number) => {
    if (!window.confirm('Are you sure you want to approve this leave?')) {
      return;
    }

    setActionLoading(leaveId);
    try {
      await approveLeave(leaveId);
      await loadLeaves();
    } catch (err) {
      const error = err as any;
      alert(error.response?.data?.error || 'Failed to approve leave');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (leaveId: number) => {
    const reason = rejectionReason[leaveId] || '';
    if (!window.confirm('Are you sure you want to reject this leave?')) {
      return;
    }

    setActionLoading(leaveId);
    try {
      await rejectLeave(leaveId, reason);
      await loadLeaves();
      setShowRejectModal(null);
      setRejectionReason({ ...rejectionReason, [leaveId]: '' });
    } catch (err) {
      const error = err as any;
      alert(error.response?.data?.error || 'Failed to reject leave');
    } finally {
      setActionLoading(null);
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

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  return (
    <div className="leave-approvals-container">
      <div className="leave-approvals-header">
        <h1>Leave Approvals</h1>
        <div className="filter-tabs">
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingLeaves.length})
          </button>
          <button
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            className={filter === 'rejected' ? 'active' : ''}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="empty-state">
          <p>No leave applications found.</p>
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
                <th>Actions</th>
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
                  <td>{leave.created_at ? formatDate(leave.created_at) : '-'}</td>
                  <td>
                    {leave.status === 'pending' && (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleApprove(leave.id)}
                          disabled={actionLoading === leave.id}
                          className="approve-btn"
                        >
                          {actionLoading === leave.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(leave.id)}
                          disabled={actionLoading === leave.id}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {leave.status === 'rejected' && leave.rejection_reason && (
                      <span className="rejection-reason" title={leave.rejection_reason}>
                        {leave.rejection_reason}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Leave Application</h2>
            <div className="form-group">
              <label htmlFor="rejectionReason">Rejection Reason (Optional)</label>
              <textarea
                id="rejectionReason"
                value={rejectionReason[showRejectModal] || ''}
                onChange={(e) =>
                  setRejectionReason({
                    ...rejectionReason,
                    [showRejectModal]: e.target.value,
                  })
                }
                rows={4}
                placeholder="Enter reason for rejection"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={actionLoading === showRejectModal}
                className="reject-btn"
              >
                {actionLoading === showRejectModal ? 'Processing...' : 'Confirm Reject'}
              </button>
              <button
                onClick={() => setShowRejectModal(null)}
                className="cancel-btn"
                disabled={actionLoading === showRejectModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApprovals;

