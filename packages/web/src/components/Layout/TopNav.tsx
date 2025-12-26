import React from 'react';
import { useHistory } from 'react-router-dom';
import { Layout, Avatar, Dropdown, Button, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { getCurrentUser, logout } from '../../services/authService';
import './TopNav.css';

const { Header } = Layout;
const { Text } = Typography;

interface TopNavProps {
  onMenuClick: () => void;
  collapsed: boolean;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick, collapsed }) => {
  const history = useHistory();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => history.push('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Header className="top-nav">
      <div className="top-nav-left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onMenuClick}
          className="menu-trigger"
        />
        <div className="app-logo">
          <span className="logo-icon">HRMS</span>
          <span className="logo-text">Portal</span>
        </div>
      </div>
      <div className="top-nav-right">
        {user && (
          <Space size="middle">
            <div className="user-info">
              <Text strong>{user.firstName} {user.lastName}</Text>
              <Text type="secondary" className="user-role">{user.roleName}</Text>
            </div>
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Avatar
                size="large"
                style={{ backgroundColor: '#805ad5', cursor: 'pointer' }}
              >
                {getInitials(user.firstName, user.lastName)}
              </Avatar>
            </Dropdown>
          </Space>
        )}
      </div>
    </Header>
  );
};

export default TopNav;
