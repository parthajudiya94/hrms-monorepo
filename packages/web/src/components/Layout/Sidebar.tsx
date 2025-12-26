import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { getCurrentUser } from '../../services/authService';
import './Sidebar.css';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/time-tracking', icon: <ClockCircleOutlined />, label: 'Time Tracking' },
  { key: '/leaves', icon: <CalendarOutlined />, label: 'My Leaves' },
  { key: '/apply-leave', icon: <PlusCircleOutlined />, label: 'Apply Leave' },
  { key: '/leave-approvals', icon: <CheckCircleOutlined />, label: 'Leave Approvals', roles: ['Admin', 'HR', 'CEO'] },
  { key: '/leave-reports', icon: <BarChartOutlined />, label: 'Leave Reports', roles: ['Admin', 'HR', 'CEO'] },
  { key: '/users', icon: <TeamOutlined />, label: 'Users', roles: ['Admin', 'HR'] },
  { key: '/attendance', icon: <FileTextOutlined />, label: 'Attendance', roles: ['Admin', 'HR'] },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports', roles: ['Admin', 'HR', 'CEO'] },
  { key: '/profile', icon: <UserOutlined />, label: 'Profile' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings', roles: ['Admin'] },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const history = useHistory();
  const location = useLocation();
  const user = getCurrentUser();

  const handleMenuClick = ({ key }: { key: string }) => {
    history.push(key);
  };

  const canAccess = (item: MenuItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!user) return false;
    return item.roles.includes(user.roleName);
  };

  const filteredMenuItems = menuItems
    .filter(canAccess)
    .map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
    }));

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={250}
      className="sidebar"
      theme="light"
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={filteredMenuItems}
        onClick={handleMenuClick}
        className="sidebar-menu"
      />
    </Sider>
  );
};

export default Sidebar;
