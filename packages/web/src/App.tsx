import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateUser from './pages/CreateUser';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';
import LeaveApprovals from './pages/LeaveApprovals';
import LeaveReports from './pages/LeaveReports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Attendance from './pages/Attendance';
import AppLayout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import { isAuthenticated } from './services/authService';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route
            exact
            path="/login"
            render={() => (isAuthenticated() ? <Redirect to="/dashboard" /> : <Login />)}
          />
          <PrivateRoute
            exact
            path="/dashboard"
            component={() => (
              <AppLayout>
                <Dashboard />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/time-tracking"
            component={() => (
              <AppLayout>
                <Dashboard />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/create-user"
            component={() => (
              <AppLayout>
                <CreateUser />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/users"
            component={() => (
              <AppLayout>
                <CreateUser />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/apply-leave"
            component={() => (
              <AppLayout>
                <ApplyLeave />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/leaves"
            component={() => (
              <AppLayout>
                <MyLeaves />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/leave-approvals"
            component={() => (
              <AppLayout>
                <LeaveApprovals />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/leave-reports"
            component={() => (
              <AppLayout>
                <LeaveReports />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/profile"
            component={() => (
              <AppLayout>
                <Profile />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/settings"
            component={() => (
              <AppLayout>
                <Settings />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/attendance"
            component={() => (
              <AppLayout>
                <Attendance />
              </AppLayout>
            )}
          />
          <PrivateRoute
            exact
            path="/reports"
            component={() => (
              <AppLayout>
                <LeaveReports />
              </AppLayout>
            )}
          />
          <Route exact path="/" render={() => <Redirect to="/dashboard" />} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;

