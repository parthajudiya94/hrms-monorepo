import React, { useState } from 'react';
import { Layout } from 'antd';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import './Layout.css';

const { Content } = Layout;

interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout className="app-layout">
      <TopNav onMenuClick={toggleSidebar} collapsed={collapsed} />
      <Layout>
        <Sidebar collapsed={collapsed} />
        <Layout className="layout-content-wrapper">
          <Content className="main-content">
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
