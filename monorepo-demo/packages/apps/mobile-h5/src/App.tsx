import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Tabbar, TabbarItem } from 'vant';
import { HomeO, UserO } from '@vant/icons';
import { useLocation, useNavigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    if (location.pathname === '/profile') return 1;
    return 0;
  };

  const handleTabChange = (index: number) => {
    if (index === 0) navigate('/');
    if (index === 1) navigate('/profile');
  };

  return (
    <div style={{ paddingBottom: '50px' }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>

      <Tabbar value={getActiveTab()} onChange={handleTabChange} fixed>
        <TabbarItem icon={<HomeO />}>首页</TabbarItem>
        <TabbarItem icon={<UserO />}>我的</TabbarItem>
      </Tabbar>
    </div>
  );
};

export default App;
