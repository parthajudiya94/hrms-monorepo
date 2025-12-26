import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { createUser, getRoles } from '../services/userService';
import { Role } from '../types';
import './CreateUser.css';

const CreateUser: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const history = useHistory();
  const user = getCurrentUser();
  const hasLoadedRef = useRef(false);

  const loadRoles = useCallback(async () => {
    try {
      const data = await getRoles();
      setRoles(data.roles);
    } catch (err) {
      setError('Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      history.push('/login');
      return;
    }
    
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await createUser(email, password, firstName, lastName, parseInt(roleId));
      setSuccess('User created successfully!');
      // Reset form
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setRoleId('');
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="create-user-container">
      <div className="create-user-card">
        <h1>Create New User</h1>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            {loadingRoles ? (
              <div>Loading roles...</div>
            ) : (
              <select
                id="role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading || loadingRoles} className="submit-button">
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={() => history.push('/dashboard')}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;

