# @demo/utils

通用工具函数库,提供日期处理、格式化、请求封装、校验等常用功能。

## 安装

\`\`\`bash
pnpm add @demo/utils
\`\`\`

## 使用

### 日期处理

\`\`\`typescript
import { formatDate, formatRelativeTime, getDateRange } from '@demo/utils';

// 格式化日期
formatDate(new Date(), 'YYYY-MM-DD'); // '2026-03-12'

// 相对时间
formatRelativeTime(new Date()); // '刚刚'

// 获取日期范围
const [start, end] = getDateRange(7); // 最近 7 天
\`\`\`

### 格式化

\`\`\`typescript
import {
  formatMoney,
  formatFileSize,
  formatPercent,
  formatPhone,
} from '@demo/utils';

formatMoney(1234567.89); // '1,234,567.89'
formatFileSize(1024); // '1.00 KB'
formatPercent(0.8523, true); // '85.23%'
formatPhone('13812345678'); // '138****5678'
\`\`\`

### HTTP 请求

\`\`\`typescript
import { get, post, put, del } from '@demo/utils';

// GET 请求
const users = await get('/users');

// POST 请求
const user = await post('/users', { name: 'John' });

// PUT 请求
await put('/users/1', { name: 'Jane' });

// DELETE 请求
await del('/users/1');
\`\`\`

### 校验

\`\`\`typescript
import {
  isValidPhone,
  isValidEmail,
  getPasswordStrength,
  isEmpty,
} from '@demo/utils';

isValidPhone('13812345678'); // true
isValidEmail('test@example.com'); // true
getPasswordStrength('Abc123!@#'); // 3 (很强)
isEmpty(null); // true
\`\`\`

### 存储

\`\`\`typescript
import { storage, sessionStorage } from '@demo/utils';

// localStorage
storage.set('user', { name: 'John', age: 30 });
const user = storage.get('user');
storage.remove('user');

// sessionStorage
sessionStorage.set('token', 'xxx');
const token = sessionStorage.get('token');
\`\`\`

## API 文档

详细 API 文档请查看源码中的 JSDoc 注释。

## 构建

\`\`\`bash
pnpm build
\`\`\`

## 开发

\`\`\`bash
pnpm dev
\`\`\`
