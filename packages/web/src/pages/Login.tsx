import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../services/authService';
import './Login.css';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError('');

    try {
      await login(values.email, values.password);
      history.push('/dashboard');
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <Card className="login-card" bordered={false}>
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <div>
              <div className="login-logo">
                <span className="logo-icon">HRMS</span>
              </div>
              <Title level={2} style={{ marginTop: 24, marginBottom: 8 }}>Welcome Back</Title>
              <Text type="secondary">Sign in to your HRMS account</Text>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={() => setError('')}
              />
            )}

            <Form
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <div className="login-footer">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Default credentials: admin@sample.local / admin123
              </Text>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default Login;
