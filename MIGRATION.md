# MongoDB 数据迁移指南

## 前置条件

1. **MongoDB 服务器运行中**
   ```bash
   # 本地运行 MongoDB
   mongod

   # 或使用 Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **环境变量配置** (可选)
   ```bash
   # .env 或系统环境变量
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=phantom_mock
   ```

## 迁移步骤

### 1. 编译迁移脚本
```bash
pnpm build:backend
```

### 2. 运行迁移
```bash
pnpm migrate
```

### 3. 验证迁移结果
```bash
# 使用 MongoDB 客户端查看
mongosh

# 在 mongosh 中
use phantom_mock
db.users.find().pretty()
db.apiKeys.find().pretty()
db.usageRecords.find().pretty()
# 等等...
```

## 迁移内容

迁移脚本会将以下 JSON 文件转换为 MongoDB 集合：

| JSON 文件 | MongoDB 集合 | 说明 |
|---------|-----------|------|
| users.json | users | 用户数据 |
| api_keys.json | apiKeys | API 密钥 |
| usage_records.json | usageRecords | 使用记录 |
| invoices.json | invoices | 账单 |
| actions.json | actions | Actions |
| notifications.json | notifications | 通知 |
| invitations.json | invitationRecords | 邀请记录 |

## 数据转换

迁移脚本会自动：

1. **生成 MongoDB ObjectId**
   - 为每条记录生成唯一的 `_id`

2. **转换时间戳**
   - 将 Unix 时间戳转换为 JavaScript Date 对象
   - 例如: `1773500407915` → `Date(2025-01-21T...)`

3. **创建数据库索引**
   - 自动为常用字段创建索引以提高查询性能

## 故障排除

### 连接失败
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**解决方案**: 确保 MongoDB 服务器正在运行

### 数据库权限错误
```
Error: authentication failed
```
**解决方案**: 检查 MONGODB_URI 中的用户名和密码

### 迁移后数据不完整
- 检查 `/data` 目录中的 JSON 文件是否存在
- 查看迁移脚本的输出日志

## 后续步骤

迁移完成后，需要更新应用代码以使用 MongoDB：

1. 在 `src/index.ts` 中初始化数据库连接
2. 将现有的 JSON 存储层替换为 MongoDB 操作
3. 更新 API 端点以使用新的数据库方法

## 回滚

如果需要回滚迁移：

```bash
# 删除 MongoDB 数据库
mongosh
use phantom_mock
db.dropDatabase()
```

然后应用会自动使用 `/data` 目录中的 JSON 文件。
