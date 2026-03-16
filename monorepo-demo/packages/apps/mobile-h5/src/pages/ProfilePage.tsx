import React from 'react';
import { NavBar, Cell, CellGroup, Card, Button, Space } from 'vant';
import { formatDate, formatPhone } from '@demo/utils';
import type { User, Gender, UserStatus } from '@demo/types';

const ProfilePage: React.FC = () => {
  const mockUser: User = {
    id: '1',
    username: 'demo_user',
    nickname: '演示用户',
    email: 'demo@example.com',
    phone: '13812345678',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    gender: Gender.Male,
    status: UserStatus.Active,
    roles: [],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  return (
    <div>
      <NavBar title="个人中心" fixed />
      
      <div style={{ paddingTop: '46px' }}>
        <Card style={{ margin: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={mockUser.avatar}
              alt="avatar"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                marginRight: '16px',
              }}
            />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                {mockUser.nickname}
              </div>
              <div style={{ color: '#969799', fontSize: '14px' }}>
                @{mockUser.username}
              </div>
            </div>
          </div>
        </Card>

        <CellGroup title="个人信息" style={{ margin: '16px 0' }}>
          <Cell title="用户 ID" value={mockUser.id} />
          <Cell title="用户名" value={mockUser.username} />
          <Cell title="昵称" value={mockUser.nickname} />
          <Cell title="邮箱" value={mockUser.email} />
          <Cell title="手机号" value={formatPhone(mockUser.phone)} />
          <Cell 
            title="性别" 
            value={mockUser.gender === Gender.Male ? '男' : '女'} 
          />
        </CellGroup>

        <CellGroup title="账号信息" style={{ margin: '16px 0' }}>
          <Cell 
            title="注册时间" 
            value={formatDate(mockUser.createdAt, 'YYYY-MM-DD')} 
          />
          <Cell 
            title="最后登录" 
            value={formatDate(mockUser.lastLoginAt || '', 'YYYY-MM-DD HH:mm')} 
          />
          <Cell 
            title="状态" 
            value={mockUser.status === UserStatus.Active ? '正常' : '禁用'} 
          />
        </CellGroup>

        <div style={{ margin: '16px', marginTop: '32px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" size="large" block>
              编辑资料
            </Button>
            <Button size="large" block>
              设置
            </Button>
            <Button type="danger" size="large" block>
              退出登录
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
