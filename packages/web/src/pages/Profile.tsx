import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import './Profile.css';

const Profile: React.FC = () => {
  const user = getCurrentUser();
  const history = useHistory();

  useEffect(() => {
    if (!user) {
      history.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>My Profile</h1>
        <div className="profile-content">
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>First Name</label>
                <p>{user.firstName}</p>
              </div>
              <div className="info-item">
                <label>Last Name</label>
                <p>{user.lastName}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{user.email}</p>
              </div>
              <div className="info-item">
                <label>Role</label>
                <p>{user.roleName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

