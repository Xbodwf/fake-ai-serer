# 基础镜像层 - 共享 yarn 配置
FROM node:24-alpine AS base
RUN corepack enable && yarn config set registry https://registry.npmmirror.com

# 构建阶段 - 前端
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock* ./
RUN yarn install --frozen-lockfile && yarn cache clean
COPY frontend/ ./
RUN yarn build

# 构建阶段 - 后端
FROM base AS backend-builder
WORKDIR /app
COPY package.json yarn.lock* tsconfig.json ./
RUN yarn install --frozen-lockfile && yarn cache clean
COPY src/ ./src/
RUN yarn build

# 生产阶段
FROM base AS production
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --production --frozen-lockfile && yarn cache clean && rm -rf /tmp/*
COPY --from=backend-builder /app/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
RUN mkdir -p /app/data
EXPOSE 7143
ENV NODE_ENV=production
ENV PORT=7143
CMD ["node", "dist/index.js"]
