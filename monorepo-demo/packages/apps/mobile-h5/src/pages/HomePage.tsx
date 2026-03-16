import React from 'react';
import { NavBar, Cell, CellGroup, Grid, GridItem, Card, Tag } from 'vant';
import { formatDate } from '@demo/utils';

const HomePage: React.FC = () => {
  return (
    <div>
      <NavBar title="Mobile H5 Demo" fixed />
      
      <div style={{ paddingTop: '46px' }}>
        <Grid columnNum={4} style={{ marginTop: '16px' }}>
          <GridItem text="应用" />
          <GridItem text="包管理" />
          <GridItem text="工具" />
          <GridItem text="更多" />
        </Grid>

        <Card style={{ margin: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
            欢迎使用 Mobile H5
          </div>
          <div style={{ color: '#969799', fontSize: '14px', lineHeight: '20px' }}>
            这是一个基于 Monorepo 架构的移动端 H5 应用,使用 React + Vant 构建,
            展示了如何在移动端项目中使用共享的工具库和类型定义。
          </div>
        </Card>

        <CellGroup title="使用的共享包" style={{ margin: '16px 0' }}>
          <Cell title="@demo/utils" label="工具函数库" />
          <Cell title="@demo/types" label="TypeScript 类型" />
          <Cell title="@demo/eslint-config" label="ESLint 配置" />
          <Cell title="@demo/tsconfig" label="TypeScript 配置" />
          <Cell title="@demo/vite-config" label="Vite 配置" />
        </CellGroup>

        <Card style={{ margin: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            功能展示
          </div>
          <div style={{ marginTop: '12px' }}>
            <Tag type="primary" style={{ marginRight: '8px' }}>主要</Tag>
            <Tag type="success" style={{ marginRight: '8px' }}>成功</Tag>
            <Tag type="warning" style={{ marginRight: '8px' }}>警告</Tag>
            <Tag type="danger">危险</Tag>
          </div>
        </Card>

        <CellGroup title="当前时间" style={{ margin: '16px 0' }}>
          <Cell title="完整时间" value={formatDate(new Date())} />
          <Cell title="日期" value={formatDate(new Date(), 'YYYY-MM-DD')} />
          <Cell title="时间" value={formatDate(new Date(), 'HH:mm:ss')} />
        </CellGroup>
      </div>
    </div>
  );
};

export default HomePage;
