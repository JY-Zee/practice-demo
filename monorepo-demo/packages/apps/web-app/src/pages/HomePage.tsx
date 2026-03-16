import React from 'react';
import { Card as AntCard, Space, Typography, Statistic, Row, Col } from 'antd';
import { Button, Card } from '@demo/ui-react';
import { formatDate } from '@demo/utils';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>欢迎来到 React Web 应用</Title>

      <Paragraph>
        这是一个基于 Monorepo 架构的 React 应用示例,展示了如何在多包项目中共享代码和组件。
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <AntCard>
            <Statistic
              title="共享包数量"
              value={5}
              suffix="个"
            />
          </AntCard>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <AntCard>
            <Statistic
              title="应用数量"
              value={3}
              suffix="个"
            />
          </AntCard>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <AntCard>
            <Statistic
              title="构建时间"
              value={formatDate(new Date(), 'HH:mm:ss')}
            />
          </AntCard>
        </Col>
      </Row>

      <Card title="使用的共享包" shadow>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            <strong>@demo/ui-react:</strong> React UI 组件库
          </Paragraph>
          <Paragraph>
            <strong>@demo/utils:</strong> 工具函数库(日期、格式化、请求等)
          </Paragraph>
          <Paragraph>
            <strong>@demo/types:</strong> TypeScript 类型定义
          </Paragraph>
          <Paragraph>
            <strong>@demo/eslint-config:</strong> ESLint 配置
          </Paragraph>
          <Paragraph>
            <strong>@demo/tsconfig:</strong> TypeScript 配置
          </Paragraph>
          <Paragraph>
            <strong>@demo/vite-config:</strong> Vite 配置
          </Paragraph>
        </Space>
      </Card>

      <Card title="演示功能" shadow>
        <Space>
          <Button type="primary">主要按钮</Button>
          <Button type="default">默认按钮</Button>
          <Button type="dashed">虚线按钮</Button>
          <Button type="link">链接按钮</Button>
        </Space>
      </Card>

      <Card title="当前时间" shadow>
        <Paragraph>
          完整时间: {formatDate(new Date())}
        </Paragraph>
        <Paragraph>
          日期: {formatDate(new Date(), 'YYYY-MM-DD')}
        </Paragraph>
        <Paragraph>
          时间: {formatDate(new Date(), 'HH:mm:ss')}
        </Paragraph>
      </Card>
    </Space>
  );
};

export default HomePage;
