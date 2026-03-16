import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { HomeOutlined, UserOutlined } from '@ant-design/icons';

import HomePage from './pages/HomePage';
import UsersPage from './pages/UsersPage';

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: '20px', marginRight: '50px' }}>
          React Web App
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['/']}
          items={[
            {
              key: '/',
              icon: <HomeOutlined />,
              label: <Link to="/">首页</Link>,
            },
            {
              key: '/users',
              icon: <UserOutlined />,
              label: <Link to="/users">用户列表</Link>,
            },
          ]}
        />
      </Header>
      <Content style={{ padding: '24px 50px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<UsersPage />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        React Web App ©{new Date().getFullYear()} Created with Monorepo
      </Footer>
    </Layout>
  );
};

export default App;
