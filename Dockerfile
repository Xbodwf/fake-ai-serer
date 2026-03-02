# 构建阶段 - 前端
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装依赖
RUN npm ci

# 复制前端源代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# 构建阶段 - 后端
FROM node:20-alpine AS backend-builder

WORKDIR /app

# 复制后端依赖文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm ci

# 复制后端源代码
COPY src/ ./src/

# 构建后端
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 复制后端依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制构建产物
COPY --from=backend-builder /app/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 复制数据目录（用于持久化）
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动命令
CMD ["node", "dist/index.js"]
