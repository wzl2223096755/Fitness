-- ============================================================================
-- 每日健身小贴士功能数据库迁移脚本
-- 
-- 本脚本创建以下表：
-- 1. daily_tips: 存储健身小贴士数据
-- 2. user_favorite_tips: 存储用户收藏的小贴士关系
--
-- 功能说明：
-- - daily_tips表包含标题、内容、分类、标签、来源等字段
-- - user_favorite_tips表实现用户与小贴士的多对多收藏关系
-- - 设置外键约束和级联删除规则
-- - 创建必要的索引以优化查询性能
--
-- 执行前请确保：
-- 1. 已备份数据库
-- 2. 在非生产环境测试过此脚本
-- 3. users表已存在
--
-- 对应需求: 1.1, 1.2, 1.3
-- ============================================================================

-- 创建 daily_tips 表
CREATE TABLE IF NOT EXISTS daily_tips (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    title VARCHAR(200) NOT NULL COMMENT '小贴士标题',
    content TEXT NOT NULL COMMENT '小贴士内容',
    category VARCHAR(50) NOT NULL COMMENT '分类（训练技巧、营养建议、恢复方法、伤病预防、心理调节、装备使用）',
    tags VARCHAR(200) COMMENT '标签（逗号分隔）',
    source VARCHAR(200) COMMENT '来源',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category) COMMENT '分类索引，优化按分类查询'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日健身小贴士表';

-- 创建 user_favorite_tips 表
CREATE TABLE IF NOT EXISTS user_favorite_tips (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    tip_id BIGINT NOT NULL COMMENT '小贴士ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    UNIQUE KEY uk_user_tip (user_id, tip_id) COMMENT '唯一约束，防止重复收藏',
    CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE COMMENT '外键约束，用户删除时级联删除收藏',
    CONSTRAINT fk_favorite_tip FOREIGN KEY (tip_id) REFERENCES daily_tips(id) ON DELETE CASCADE COMMENT '外键约束，小贴士删除时级联删除收藏',
    INDEX idx_user_id (user_id) COMMENT '用户ID索引，优化查询用户收藏列表',
    INDEX idx_tip_id (tip_id) COMMENT '小贴士ID索引，优化查询小贴士被收藏情况'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏小贴士关系表';

-- 验证表创建结果
SELECT 'daily_tips 表创建完成' AS status;
SELECT 'user_favorite_tips 表创建完成' AS status;

-- 显示表结构（可选，用于验证）
-- SHOW CREATE TABLE daily_tips;
-- SHOW CREATE TABLE user_favorite_tips;

-- 验证索引创建
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    INDEX_TYPE
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('daily_tips', 'user_favorite_tips')
ORDER BY 
    TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- 验证外键约束
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    DELETE_RULE
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_favorite_tips'
    AND REFERENCED_TABLE_NAME IS NOT NULL;
