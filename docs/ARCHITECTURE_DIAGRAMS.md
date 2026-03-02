# AFitness 系统架构图

> 本文档包含系统的各类架构图，使用Mermaid格式，可在GitHub、VS Code等环境中直接渲染。

## 目录

1. [系统整体架构](#1-系统整体架构)
2. [数据库ER图](#2-数据库er图)
3. [模块依赖关系](#3-模块依赖关系)
4. [API调用流程](#4-api调用流程)
5. [技术栈总览](#5-技术栈总览)

---

## 1. 系统整体架构

### 1.1 三层架构图

```mermaid
graph TB
    subgraph "表现层 Presentation Layer"
        FE[用户端前端<br/>Vue 3 + Element Plus<br/>Port: 3001]
        ADMIN[管理端前端<br/>Vue 3 + Element Plus<br/>Port: 3002]
        MOBILE[移动端 H5<br/>Vue 3 + Vant]
    end
    
    subgraph "网关层 Gateway Layer"
        PROXY[Vite Dev Proxy / Nginx<br/>负载均衡 + SSL终止]
    end
    
    subgraph "应用层 Application Layer"
        API[Spring Boot 3.2.5<br/>REST API<br/>Port: 8080]
        
        subgraph "安全过滤链"
            F1[CORS Filter]
            F2[XSS Filter]
            F3[JWT Auth Filter]
            F4[Rate Limit Filter]
        end
        
        subgraph "业务模块 Business Modules"
            M1[用户模块<br/>User Module]
            M2[训练模块<br/>Training Module]
            M3[营养模块<br/>Nutrition Module]
            M4[恢复模块<br/>Recovery Module]
            M5[管理模块<br/>Admin Module]
        end
        
        subgraph "共享内核 Shared Kernel"
            S1[Security]
            S2[Common Response]
            S3[Event Bus]
            S4[Exception Handler]
        end
    end
    
    subgraph "数据层 Data Layer"
        CACHE[Caffeine<br/>本地缓存]
        REDIS[Redis<br/>分布式缓存]
        MYSQL[(MySQL 8.0<br/>生产数据库)]
        H2[(H2 Database<br/>开发数据库)]
    end
    
    subgraph "监控层 Monitoring Layer"
        ACT[Spring Actuator]
        PROM[Prometheus Metrics]
        LOG[Logback + JSON]
    end
    
    FE --> PROXY
    ADMIN --> PROXY
    MOBILE --> PROXY
    PROXY --> API
    
    API --> F1 --> F2 --> F3 --> F4
    F4 --> M1 & M2 & M3 & M4 & M5
    
    M1 & M2 & M3 & M4 & M5 --> S1 & S2 & S3 & S4
    
    M1 & M2 & M3 & M4 --> CACHE
    CACHE --> MYSQL
    CACHE -.-> REDIS
    CACHE -.-> H2
    
    API --> ACT --> PROM
    API --> LOG
```

### 1.2 部署架构图

```mermaid
graph LR
    subgraph "开发环境"
        DEV_FE[Frontend Dev Server<br/>:3001, :3002]
        DEV_BE[Spring Boot<br/>:8080]
        DEV_DB[(H2 Memory DB)]
        
        DEV_FE --> DEV_BE --> DEV_DB
    end
    
    subgraph "Docker环境"
        DOCKER_FE[Nginx Container<br/>:80]
        DOCKER_BE[Spring Boot Container<br/>:8080]
        DOCKER_DB[(MySQL Container<br/>:3306)]
        DOCKER_REDIS[(Redis Container<br/>:6379)]
        
        DOCKER_FE --> DOCKER_BE
        DOCKER_BE --> DOCKER_DB
        DOCKER_BE --> DOCKER_REDIS
    end
    
    subgraph "生产环境"
        LB[Load Balancer<br/>Nginx]
        PROD_FE[Static Files<br/>CDN]
        PROD_BE1[API Server 1]
        PROD_BE2[API Server 2]
        PROD_DB[(MySQL Cluster)]
        PROD_REDIS[(Redis Cluster)]
        
        LB --> PROD_FE
        LB --> PROD_BE1 & PROD_BE2
        PROD_BE1 & PROD_BE2 --> PROD_DB
        PROD_BE1 & PROD_BE2 --> PROD_REDIS
    end
```

---

## 2. 数据库ER图

### 2.1 核心实体关系

```mermaid
erDiagram
    USER ||--o{ TRAINING_RECORD : "创建"
    USER ||--o{ NUTRITION_RECORD : "记录"
    USER ||--o{ RECOVERY_DATA : "记录"
    USER ||--o{ BODY_RECORD : "追踪"
    USER ||--o{ TRAINING_PLAN : "拥有"
    USER ||--|| USER_SETTINGS : "配置"
    USER ||--o{ USER_ACHIEVEMENT : "获得"
    USER ||--o{ TRAINING_ADVICE : "接收"
    
    TRAINING_PLAN ||--o{ TRAINING_PLAN_DAY : "包含"
    TRAINING_PLAN_DAY ||--o{ TRAINING_PLAN_EXERCISE : "包含"
    
    USER {
        bigint id PK "主键"
        varchar username UK "用户名"
        varchar password "密码(BCrypt)"
        varchar email "邮箱"
        int age "年龄"
        decimal weight "体重(kg)"
        varchar gender "性别"
        decimal height "身高(cm)"
        varchar experience_level "训练经验"
        varchar role "角色(USER/ADMIN)"
        int points "积分"
        timestamp created_at "创建时间"
        timestamp updated_at "更新时间"
    }
    
    TRAINING_RECORD {
        bigint id PK "主键"
        bigint user_id FK "用户ID"
        varchar exercise_name "动作名称"
        int sets "组数"
        int reps "次数"
        decimal weight "重量(kg)"
        date training_date "训练日期"
        int duration "时长(分钟)"
        varchar notes "备注"
        decimal total_volume "总训练量"
        decimal training_stress "训练压力"
    }
    
    NUTRITION_RECORD {
        bigint id PK "主键"
        bigint user_id FK "用户ID"
        date record_date "记录日期"
        varchar meal_type "餐次类型"
        varchar food_name "食物名称"
        int calories "卡路里"
        decimal protein "蛋白质(g)"
        decimal carbs "碳水(g)"
        decimal fat "脂肪(g)"
        decimal fiber "纤维(g)"
        int amount "份量(g)"
    }
    
    RECOVERY_DATA {
        bigint id PK "主键"
        bigint user_id FK "用户ID"
        timestamp timestamp "记录时间"
        int recovery_score "恢复评分(0-100)"
        decimal sleep_hours "睡眠时长"
        int sleep_quality "睡眠质量(1-10)"
        int heart_rate_variability "心率变异性"
        int resting_heart_rate "静息心率"
        decimal muscle_soreness "肌肉酸痛(1-10)"
        decimal stress_level "压力水平(1-10)"
        varchar notes "备注"
    }
    
    BODY_RECORD {
        bigint id PK "主键"
        bigint user_id FK "用户ID"
        decimal weight "体重(kg)"
        decimal body_fat "体脂率(%)"
        decimal muscle_mass "肌肉量(kg)"
        decimal waist_circumference "腰围(cm)"
        decimal hip_circumference "臀围(cm)"
        decimal chest_circumference "胸围(cm)"
        timestamp record_time "记录时间"
    }
    
    TRAINING_PLAN {
        bigint id PK "主键"
        bigint user_id FK "用户ID"
        varchar name "计划名称"
        varchar description "描述"
        date start_date "开始日期"
        date end_date "结束日期"
        varchar status "状态"
        varchar goal "目标"
        varchar level "难度级别"
        int duration_weeks "周数"
        int days_per_week "每周训练天数"
        int duration_per_session "每次时长"
    }
    
    USER_SETTINGS {
        bigint user_id PK,FK "用户ID"
        varchar theme "主题(light/dark)"
        varchar language "语言"
        boolean notifications "通知开关"
        boolean auto_save "自动保存"
    }
    
    USER_ACHIEVEMENT {
        bigint id PK "主键"
        bigint user_id FK "用户ID"
        varchar name "成就名称"
        varchar description "描述"
        varchar icon "图标"
        boolean unlocked "是否解锁"
        timestamp unlock_time "解锁时间"
    }
```

### 2.2 训练数据详细关系

```mermaid
erDiagram
    STRENGTH_TRAINING_DATA {
        bigint id PK
        bigint user_id FK
        timestamp timestamp
        varchar exercise_name
        decimal weight
        int sets
        int reps
        varchar exercise_type
        decimal one_rep_max
        decimal training_volume
        int perceived_exertion
    }
    
    CARDIO_TRAINING_DATA {
        bigint id PK
        bigint user_id FK
        timestamp timestamp
        varchar exercise_type
        int duration
        decimal distance
        int average_heart_rate
        int max_heart_rate
        int calories_burned
        decimal average_speed
        decimal pace
        int perceived_exertion
    }
    
    RECOVERY_METRICS {
        bigint id PK
        bigint user_id FK
        date record_date
        int muscle_soreness
        int sleep_quality
        int resting_heart_rate
        int subjective_energy
    }
    
    USER ||--o{ STRENGTH_TRAINING_DATA : "力量训练"
    USER ||--o{ CARDIO_TRAINING_DATA : "有氧训练"
    USER ||--o{ RECOVERY_METRICS : "恢复指标"
```

---

## 3. 模块依赖关系

### 3.1 后端模块依赖

```mermaid
graph TB
    subgraph "核心模块 Core"
        USER[用户模块<br/>User Module<br/>/api/v1/auth<br/>/api/v1/user]
    end
    
    subgraph "业务模块 Business"
        TRAIN[训练模块<br/>Training Module<br/>/api/v1/training]
        NUTRI[营养模块<br/>Nutrition Module<br/>/api/v1/nutrition]
        RECOV[恢复模块<br/>Recovery Module<br/>/api/v1/recovery]
    end
    
    subgraph "管理模块 Admin"
        ADMIN[管理模块<br/>Admin Module<br/>/api/v1/admin]
    end
    
    subgraph "共享内核 Shared Kernel"
        SEC[Security<br/>JWT + BCrypt]
        COMMON[Common<br/>ApiResponse<br/>PageResponse]
        EVENT[Event Bus<br/>Spring Events]
        CONFIG[Config<br/>Cache + DB]
        EXCEPT[Exception<br/>GlobalHandler]
    end
    
    TRAIN -->|依赖| USER
    NUTRI -->|依赖| USER
    RECOV -->|依赖| USER
    RECOV -->|依赖| TRAIN
    ADMIN -->|依赖| USER
    
    USER --> SEC & COMMON & CONFIG & EXCEPT
    TRAIN --> SEC & COMMON & EVENT & CONFIG & EXCEPT
    NUTRI --> SEC & COMMON & CONFIG & EXCEPT
    RECOV --> SEC & COMMON & EVENT & CONFIG & EXCEPT
    ADMIN --> SEC & COMMON & CONFIG & EXCEPT
    
    TRAIN -.->|发布事件| EVENT
    EVENT -.->|监听事件| RECOV
```

### 3.2 前端模块依赖

```mermaid
graph TB
    subgraph "入口 Entry"
        MAIN[main.js]
        APP[App.vue]
    end
    
    subgraph "路由模块 Router"
        ROUTER[Vue Router]
        R_AUTH[auth.js]
        R_DASH[dashboard.js]
        R_TRAIN[training.js]
        R_NUTRI[nutrition.js]
        R_ADMIN[admin.js]
    end
    
    subgraph "状态管理 Stores"
        PINIA[Pinia]
        S_USER[useUserStore]
        S_TRAIN[useTrainingStore]
        S_NUTRI[useNutritionStore]
    end
    
    subgraph "业务模块 Modules"
        M_AUTH[auth/]
        M_DASH[dashboard/]
        M_TRAIN[training/]
        M_NUTRI[nutrition/]
        M_RECOV[recovery/]
        M_SET[settings/]
    end
    
    subgraph "共享组件 Shared"
        LAYOUTS[Layouts]
        COMPS[Components]
        UTILS[Utils]
        API[API Client]
    end
    
    MAIN --> APP
    APP --> ROUTER & PINIA
    
    ROUTER --> R_AUTH & R_DASH & R_TRAIN & R_NUTRI & R_ADMIN
    PINIA --> S_USER & S_TRAIN & S_NUTRI
    
    M_AUTH & M_DASH & M_TRAIN & M_NUTRI & M_RECOV & M_SET --> LAYOUTS & COMPS & UTILS & API
    
    R_AUTH --> M_AUTH
    R_DASH --> M_DASH
    R_TRAIN --> M_TRAIN
    R_NUTRI --> M_NUTRI
```

---

## 4. API调用流程

### 4.1 用户认证流程

```mermaid
sequenceDiagram
    participant C as 客户端
    participant F as 前端
    participant A as API Server
    participant S as Security Filter
    participant J as JWT Provider
    participant D as Database
    
    Note over C,D: 登录流程
    C->>F: 输入用户名密码
    F->>A: POST /api/v1/auth/login
    A->>S: 验证请求
    S->>D: 查询用户
    D-->>S: 返回用户信息
    S->>S: BCrypt验证密码
    S->>J: 生成JWT Token
    J-->>A: Access Token + Refresh Token
    A-->>F: 返回Token
    F->>F: 存储Token到localStorage
    F-->>C: 登录成功
    
    Note over C,D: 访问受保护资源
    C->>F: 请求数据
    F->>A: GET /api/v1/training/records<br/>Header: Authorization: Bearer <token>
    A->>S: JWT Filter验证
    S->>J: 解析Token
    J-->>S: 用户信息
    S->>A: 设置SecurityContext
    A->>D: 查询数据
    D-->>A: 返回数据
    A-->>F: 响应数据
    F-->>C: 显示数据
    
    Note over C,D: Token刷新流程
    F->>A: POST /api/v1/auth/refresh<br/>Body: {refreshToken}
    A->>J: 验证Refresh Token
    J->>J: 生成新Access Token
    J-->>A: 新Token
    A-->>F: 返回新Token
```

### 4.2 训练数据录入流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant A as API Server
    participant T as Training Service
    participant E as Event Bus
    participant R as Recovery Service
    participant D as Database
    participant C as Cache
    
    U->>F: 填写训练数据
    F->>F: 表单验证
    F->>A: POST /api/v1/training/records
    A->>A: 参数校验(@Valid)
    A->>T: createRecord(dto)
    T->>T: 计算训练量<br/>volume = weight × sets × reps
    T->>T: 计算1RM估算<br/>1RM = weight × (1 + reps/30)
    T->>D: 保存训练记录
    D-->>T: 返回记录ID
    T->>C: 清除用户缓存
    T->>E: 发布TrainingCompletedEvent
    E->>R: 监听事件
    R->>R: 更新恢复状态评估
    R->>D: 保存恢复数据
    T-->>A: 返回创建结果
    A-->>F: 响应成功
    F-->>U: 显示成功提示
```

### 4.3 恢复状态评估流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant A as API Server
    participant R as Recovery Service
    participant D as Database
    
    U->>F: 请求恢复状态
    F->>A: GET /api/v1/recovery/status
    A->>R: getRecoveryStatus(userId)
    R->>D: 查询最近恢复数据
    D-->>R: 恢复数据列表
    R->>R: 计算恢复评分<br/>score = f(sleep, soreness, stress, hrv)
    R->>R: 生成训练建议
    R-->>A: RecoveryStatusDTO
    A-->>F: 响应数据
    F->>F: 渲染恢复仪表盘
    F-->>U: 显示恢复状态
    
    Note over R: 恢复评分算法
    Note over R: 基础分 = 50
    Note over R: 睡眠加分 = (sleepHours - 6) × 5
    Note over R: 酸痛扣分 = soreness × 3
    Note over R: 压力扣分 = stress × 2
    Note over R: HRV加分 = (hrv - 50) × 0.5
```

---

## 5. 技术栈总览

### 5.1 后端技术栈

```mermaid
mindmap
  root((后端技术栈))
    核心框架
      Spring Boot 3.2.5
      Spring Security 6.2
      Spring Data JPA 3.2
    数据存储
      MySQL 8.0
      H2 Database
      HikariCP连接池
    缓存
      Caffeine本地缓存
      Redis分布式缓存
    安全
      JWT认证
      BCrypt加密
      XSS防护
      CORS配置
    监控
      Spring Actuator
      Micrometer
      Prometheus
    文档
      SpringDoc OpenAPI
      Swagger UI
    测试
      JUnit 5
      jqwik属性测试
      Gatling性能测试
    工具
      Lombok
      MapStruct
      Apache POI
```

### 5.2 前端技术栈

```mermaid
mindmap
  root((前端技术栈))
    核心框架
      Vue 3.3
      Vue Router 4.2
      Pinia 2.1
    UI组件
      Element Plus 2.8
      Vant 4.9
      ECharts 5.4
    构建工具
      Vite 4.4
      Sass 1.93
    HTTP客户端
      Axios 1.5
    测试
      Vitest 4.0
      Playwright 1.57
      Vue Test Utils
    监控
      Sentry 10.32
    PWA
      Workbox
      IndexedDB
```

---

## 附录：图表渲染说明

本文档中的所有图表使用 [Mermaid](https://mermaid.js.org/) 语法编写，支持以下环境渲染：

- **GitHub**: 直接在仓库中查看即可渲染
- **VS Code**: 安装 "Markdown Preview Mermaid Support" 扩展
- **Typora**: 内置Mermaid支持
- **在线编辑器**: https://mermaid.live/

如需导出为图片，可使用 Mermaid CLI 或在线工具。
