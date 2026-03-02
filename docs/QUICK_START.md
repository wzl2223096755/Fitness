# AFitness 快速启动指南

> 5分钟快速启动系统，适合演示和开发测试

## 演示账户

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | Admin123! | 系统管理员，可访问管理端 |
| 普通用户 | testuser | password | 中级健身者 |
| 普通用户 | fitnessfan | password | 初级健身者 |
| 普通用户 | gymmaster | password | 高级健身者 |
| 普通用户 | healthpro | password | 初级健身者 |

## 方式一：一键启动（推荐）

### Windows PowerShell

```powershell
# 1. 进入项目目录
cd Fitness

# 2. 启动后端（使用H2内存数据库）
.\start-h2.ps1

# 3. 新开终端，启动前端
.\start-all.ps1
```

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 用户端 | http://localhost:3001 | Vue用户界面 |
| 管理端 | http://localhost:3002 | Vue管理界面 |
| 后端API | http://localhost:8080 | Spring Boot服务 |
| Swagger | http://localhost:8080/swagger-ui.html | API文档 |
| H2控制台 | http://localhost:8080/h2-console | 数据库管理 |

## 方式二：手动启动

### 1. 启动后端

```bash
cd Fitness

# 使用H2数据库（无需安装MySQL）
mvn spring-boot:run -Dspring-boot.run.profiles=h2

# 或使用MySQL（需要先配置数据库）
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

### 2. 启动用户端前端

```bash
cd Fitness/frontend
npm install
npm run dev
```

### 3. 启动管理端前端（可选）

```bash
cd Fitness/admin
npm install
npm run dev
```

## 方式三：Docker部署

```bash
cd Fitness

# 开发环境（H2数据库）
docker-compose -f docker-compose.dev.yml up -d

# 生产环境（MySQL数据库）
docker-compose up -d
```

## 功能演示路径

### 1. 用户端功能演示

1. **登录** → 使用 `testuser / password` 登录
2. **仪表盘** → 查看训练概览和恢复状态
3. **训练数据** → 添加/查看训练记录
4. **负荷分析** → 查看训练负荷趋势图
5. **营养追踪** → 记录每日饮食
6. **恢复状态** → 查看恢复评分和建议
7. **设置** → 修改个人信息

### 2. 管理端功能演示

1. **登录** → 使用 `admin / Admin123!` 登录
2. **系统监控** → 查看JVM、数据库状态
3. **用户管理** → 查看用户列表
4. **数据导出** → 导出Excel报表
5. **缓存管理** → 查看缓存统计

## 常见问题

### Q: 后端启动失败？

检查Java版本：
```bash
java -version  # 需要 JDK 17+
```

### Q: 前端启动失败？

检查Node版本：
```bash
node -v  # 需要 Node 16+
npm -v   # 需要 npm 8+
```

### Q: 数据库连接失败？

使用H2模式启动，无需配置数据库：
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

### Q: 端口被占用？

```powershell
# 查看端口占用
netstat -ano | findstr :8080
netstat -ano | findstr :3001

# 停止所有前端服务
.\stop-all.ps1
```

## 技术支持

- 项目文档：`Fitness/docs/`
- API文档：http://localhost:8080/swagger-ui.html
- 部署指南：`Fitness/docs/DEPLOYMENT.md`
