import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getLeaveTypes, getLeaveBalance, applyLeave, LeaveType, LeaveBalance } from '../services/leaveService';
import './ApplyLeave.css';

const ApplyLeave: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const history = useHistory();
  const user = getCurrentUser();
  const hasLoadedRef = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const [typesData, balanceData] = await Promise.all([
        getLeaveTypes(),
        getLeaveBalance(),
      ]);
      setLeaveTypes(typesData.leaveTypes);
      setBalances(balanceData.balances);
    } catch (err) {
      setError('Failed to load leave data');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      history.push('/login');
      return;
    }
    
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;
    
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await applyLeave(parseInt(leaveTypeId), startDate, endDate, reason);
      setSuccess('Leave application submitted successfully!');
      setLeaveTypeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      await loadData();
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.error || 'Failed to apply for leave');
    } finally {
      setLoading(false);
    }
  };

  const selectedBalance = balances.find((b) => b.leave_type_id === parseInt(leaveTypeId));
  const totalDays = calculateDays();
  const availableDays = selectedBalance
    ? selectedBalance.allocated_days - selectedBalance.used_days - selectedBalance.pending_days
    : 0;

  if (!user) return null;

  return (
    <div className="apply-leave-container">
      <div className="apply-leave-card">
        <h1>Apply for Leave</h1>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loadingData ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="leave-balance-section">
              <h2>Leave Balance</h2>
              <div className="balance-grid">
                {balances.map((balance) => (
                  <div key={balance.id} className="balance-card">
                    <h3>{balance.leave_type_name}</h3>
                    <div className="balance-details">
                      <div>Allocated: {balance.allocated_days} days</div>
                      <div>Used: {balance.used_days} days</div>
                      <div>Pending: {balance.pending_days} days</div>
                      <div className="available">
                        Available: {balance.allocated_days - balance.used_days - balance.pending_days} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="leave-form">
              <div className="form-group">
                <label htmlFor="leaveType">Leave Type *</label>
                <select
                  id="leaveType"
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} (Max: {type.max_days} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">End Date *</label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    disabled={loading}
                    min={startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {startDate && endDate && (
                <div className="days-info">
                  <strong>Total Working Days: {totalDays}</strong>
                  {selectedBalance && (
                    <span className={totalDays > availableDays ? 'error-text' : 'success-text'}>
                      Available: {availableDays} days
                    </span>
                  )}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reason">Reason</label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  disabled={loading}
                  placeholder="Enter reason for leave (optional)"
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading || totalDays > availableDays} className="submit-button">
                  {loading ? 'Submitting...' : 'Apply for Leave'}
                </button>
                <button
                  type="button"
                  onClick={() => history.push('/leaves')}
                  className="cancel-button"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplyLeave;

