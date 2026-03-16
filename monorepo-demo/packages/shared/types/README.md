# @demo/types

TypeScript 类型定义包,为整个 Monorepo 提供统一的类型定义。

## 安装

\`\`\`bash
pnpm add @demo/types
\`\`\`

## 使用

### API 类型

\`\`\`typescript
import type {
  ApiResponse,
  PaginationParams,
  PaginationResponse,
} from '@demo/types';

// API 响应
const response: ApiResponse<User[]> = await fetchUsers();

// 分页参数
const params: PaginationParams = {
  page: 1,
  pageSize: 20,
};

// 分页响应
const result: PaginationResponse<User> = response.data;
\`\`\`

### 用户类型

\`\`\`typescript
import type {
  User,
  UserRole,
  UserStatus,
  LoginParams,
  LoginResponse,
} from '@demo/types';

// 用户信息
const user: User = {
  id: '1',
  username: 'john',
  nickname: 'John Doe',
  email: 'john@example.com',
  gender: Gender.Male,
  status: UserStatus.Active,
  roles: [UserRole.User],
  createdAt: '2026-03-12',
  updatedAt: '2026-03-12',
};

// 登录
const loginParams: LoginParams = {
  username: 'john',
  password: '123456',
};
\`\`\`

### 通用类型

\`\`\`typescript
import type {
  ID,
  Nullable,
  Option,
  TreeNode,
  FileInfo,
} from '@demo/types';

// ID 类型
const userId: ID = '123';

// 可空类型
const name: Nullable<string> = null;

// 选项
const options: Option[] = [
  { label: '选项1', value: 1 },
  { label: '选项2', value: 2 },
];

// 树形节点
const tree: TreeNode = {
  id: '1',
  name: '根节点',
  children: [
    { id: '1-1', name: '子节点1' },
    { id: '1-2', name: '子节点2' },
  ],
};
\`\`\`

## 类型列表

### API 相关
- `ApiResponse` - API 响应结构
- `PaginationParams` - 分页参数
- `PaginationResponse` - 分页响应
- `ListParams` - 列表查询参数
- `UploadResponse` - 上传响应

### 用户相关
- `User` - 用户信息
- `Gender` - 性别枚举
- `UserStatus` - 用户状态
- `UserRole` - 用户角色
- `LoginParams` - 登录参数
- `LoginResponse` - 登录响应
- `RegisterParams` - 注册参数
- `UpdateProfileParams` - 更新资料参数
- `ChangePasswordParams` - 修改密码参数

### 通用类型
- `ID` - ID 类型
- `Nullable` - 可空类型
- `KeyValue` - 键值对
- `Option` - 选项类型
- `TreeNode` - 树形节点
- `Timestamp` - 时间戳
- `Coordinate` - 坐标
- `Address` - 地址
- `FileInfo` - 文件信息
- `OperationStatus` - 操作状态

## 构建

\`\`\`bash
pnpm build
\`\`\`
