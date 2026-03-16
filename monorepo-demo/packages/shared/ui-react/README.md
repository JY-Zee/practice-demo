# @demo/ui-react

React UI 组件库,基于 Ant Design 封装。

## 安装

\`\`\`bash
pnpm add @demo/ui-react
\`\`\`

## 使用

### 引入样式

在应用入口文件引入:

\`\`\`tsx
import 'antd/dist/reset.css';
import '@demo/ui-react/style.css';
\`\`\`

### Button 组件

\`\`\`tsx
import { Button } from '@demo/ui-react';

function App() {
  return (
    <div>
      <Button type="primary">主要按钮</Button>
      <Button fullWidth>全宽按钮</Button>
    </div>
  );
}
\`\`\`

### Input 组件

\`\`\`tsx
import { Input } from '@demo/ui-react';

function App() {
  return (
    <div>
      <Input label="用户名" required placeholder="请输入用户名" />
      <Input placeholder="无标签输入框" />
    </div>
  );
}
\`\`\`

### Card 组件

\`\`\`tsx
import { Card } from '@demo/ui-react';

function App() {
  return (
    <Card title="卡片标题" shadow hoverable>
      卡片内容
    </Card>
  );
}
\`\`\`

### Table 组件

\`\`\`tsx
import { Table } from '@demo/ui-react';
import type { PaginationResponse } from '@demo/types';

// 支持普通数组
const dataSource = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
];

// 支持分页响应数据
const paginationData: PaginationResponse<User> = {
  list: [...],
  total: 100,
  page: 1,
  pageSize: 20,
  totalPages: 5,
  hasNext: true,
  hasPrev: false,
};

function App() {
  return (
    <Table
      dataSource={paginationData}
      columns={[
        { title: 'ID', dataIndex: 'id' },
        { title: '姓名', dataIndex: 'name' },
      ]}
    />
  );
}
\`\`\`

## 组件列表

- **Button** - 按钮组件
- **Input** - 输入框组件(支持标签)
- **Card** - 卡片组件(支持阴影和悬停)
- **Table** - 表格组件(支持分页响应数据)

## 构建

\`\`\`bash
pnpm build
\`\`\`

## 特性

- ✅ 基于 Ant Design 5.x
- ✅ TypeScript 支持
- ✅ Tree-shaking 友好
- ✅ 支持 ESM 和 CJS
- ✅ 与 @demo/types 类型集成
