package com.wzl.fitness.service;

import com.wzl.fitness.entity.Role;
import com.wzl.fitness.entity.User;
import com.wzl.fitness.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 系统启动时初始化管理员账户
 */
@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminInitializer.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeAdminUser();
    }

    /**
     * 初始化管理员账户
     */
    private void initializeAdminUser() {
        String adminUsername = "admin";
        String defaultPassword = "Test123!";  // 符合前端密码规则：包含大写字母、小写字母和数字
        
        // 检查是否已存在管理员
        var existingAdmin = userRepository.findByUsername(adminUsername);
        if (existingAdmin.isPresent()) {
            // 更新密码确保可以登录
            User admin = existingAdmin.get();
            admin.setPassword(passwordEncoder.encode(defaultPassword));
            userRepository.save(admin);
            logger.info("管理员账户已存在: {}，默认密码已重置为: {}", adminUsername, defaultPassword);
            return;
        }

        // 创建管理员账户
        User admin = User.builder()
            .username(adminUsername)
            .email("admin@fitness.com")
            .password(passwordEncoder.encode(defaultPassword))
            .role(Role.ADMIN)
            .age(30)
            .weight(70.0)
            .build();

        User savedAdmin = userRepository.save(admin);
        logger.info("管理员账户创建成功: {} (ID: {})，默认密码: {}", adminUsername, savedAdmin.getId(), defaultPassword);
        logger.info("请在首次登录后修改默认密码");
    }
}