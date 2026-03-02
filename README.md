# AFitness 力量训练负荷与恢复监控系统

前后端分离的双端健身应用：用户端 Web、管理端 Web，共用同一 Spring Boot 后端。

## 技术栈

| 端       | 技术 |
|----------|------|
| 后端     | Java 17, Spring Boot 3, JPA, Spring Security, JWT, MySQL/H2, Redis, SpringDoc |
| 用户端 Web | Vue 3, Vite, Element Plus, Vant, ECharts, PWA, Sentry |
| 管理端 Web | Vue 3, Vite, Element Plus |

## 目录结构

```
Fitness/
├── pom.xml                 # 后端依赖与构建
├── src/main/java/          # 后端源码 (com.wzl.fitness)
├── src/main/resources/     # 配置文件 (application*.properties)
├── shared/                 # 前后端共享模块 (request, errorHandler, apiCache, fitness, auth, admin, styles)
├── frontend/               # 用户端 Web (端口 3001)
└── admin/                  # 管理端 Web (端口 3002)
```

## 本地运行

### 1. 环境要求

- Node.js 18+
- JDK 17+
- MySQL 8（或使用 H2 内存库，见 `application-h2.properties`）

### 2. 后端

```bash
cd Fitness
mvn spring-boot:run
# 默认端口 8080；API 前缀 /api/v1
```

使用 MySQL 时指定 profile：

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

### 3. 用户端前端

```bash
cd Fitness/frontend
npm install
npm run dev
# 访问 http://localhost:3001 ，/api 与 /ws 代理到 8080
```

### 4. 管理端前端

```bash
cd Fitness/admin
npm install
npm run dev
# 访问 http://localhost:3002 ，/api 代理到 8080
```

### 5. 环境变量（可选）

在 `frontend` 或 `admin` 下复制 `.env.example` 为 `.env`，按需配置：

- `VITE_API_BASE_URL`：API 基础地址（留空则用相对路径 + 开发代理）
- 用户端还可配置 `VITE_SENTRY_DSN`、`VITE_ENABLE_SENTRY`（错误监控）

## 构建

```bash
# 后端
mvn clean package

# 用户端
cd frontend && npm run build   # 输出到 frontend/dist

# 管理端
cd admin && npm run build      # 输出到 admin/dist
```

## 共享模块 (shared)

`Fitness/shared` 供用户端与管理端共同使用，包含：

- **api**: `request`、`auth`、`admin`、`fitness`、`apiCache`、`cachedApi`
- **utils**: `errorHandler`、`performance`、`message`
- **styles**: SCSS 变量与入口

前端通过 Vite 别名 `@shared` 指向 `../shared` 引用上述模块。

## 主要功能

- 用户注册/登录、个人资料与设置
- 训练记录、负荷分析、恢复状态与训练建议
- 营养追踪、仪表盘与数据可视化
- 管理端：用户管理、审计日志、系统统计与监控

## 其他说明

- **Token 刷新**：请求 401 时，共享请求模块会尝试用 `refreshToken` 调用 `/api/v1/auth/refresh` 换取新 `accessToken` 并自动重试一次；若刷新失败则清除登录态并跳转登录页。
- **错误监控**：用户端在开发环境下可通过页面右下角 🐛 按钮打开错误监控面板，查看前端收集的错误日志；生产环境可配置 Sentry（`VITE_SENTRY_DSN`）。

## 许可证

项目内部使用，未指定开源协议。