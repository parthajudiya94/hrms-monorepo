import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import './Settings.css';

const Settings: React.FC = () => {
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
    <div className="settings-container">
      <div className="settings-card">
        <h1>Settings</h1>
        <div className="settings-content">
          <div className="settings-section">
            <h2>System Settings</h2>
            <p>Settings management will be available soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

