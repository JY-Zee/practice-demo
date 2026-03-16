import React, { useState } from 'react';
import { Space, Tag, Typography } from 'antd';
import { Table } from '@demo/ui-react';
import type { User, Gender, UserStatus, PaginationResponse } from '@demo/types';
import { formatDate, formatPhone } from '@demo/utils';

const { Title } = Typography;

// 模拟用户数据
const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  username: `user${i + 1}`,
  nickname: `用户${i + 1}`,
  email: `user${i + 1}@example.com`,
  phone: `138${String(i + 1).padStart(8, '0')}`,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
  gender: (i % 3) as Gender,
  status: (i % 2) as UserStatus,
  roles: [],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
}));

const UsersPage: React.FC = () => {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });

  // 模拟分页数据
  const getPaginationData = (): PaginationResponse<User> => {
    const { page, pageSize } = pagination;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const list = mockUsers.slice(start, end);

    return {
      list,
      total: mockUsers.length,
      page,
      pageSize,
      totalPages: Math.ceil(mockUsers.length / pageSize),
      hasNext: end < mockUsers.length,
      hasPrev: page > 1,
    };
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    setPagination({
      page,
      pageSize: pageSize || pagination.pageSize,
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => formatPhone(phone),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: Gender) => {
        const genderMap = {
          [Gender.Male]: '男',
          [Gender.Female]: '女',
          [Gender.Unknown]: '未知',
        };
        return genderMap[gender];
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => {
        const statusConfig = {
          [UserStatus.Active]: { text: '正常', color: 'success' },
          [UserStatus.Disabled]: { text: '禁用', color: 'error' },
          [UserStatus.Deleted]: { text: '已删除', color: 'default' },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date, 'YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>用户列表</Title>
      <Table
        dataSource={getPaginationData()}
        columns={columns}
        rowKey="id"
        showPagination
        pagination={{
          onChange: handleTableChange,
        }}
      />
    </Space>
  );
};

export default UsersPage;
