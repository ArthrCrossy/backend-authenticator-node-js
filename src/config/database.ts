// src/config/database.ts
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    port: Number(process.env.DB_PORT || 3306),
});

export async function run(sql: string, params: any[] = []) {
    return pool.execute(sql, params);
}

export async function createTables() {
    await run(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            phone VARCHAR(30) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS user_profile (
                                                    user_id INT PRIMARY KEY,
                                                    sex ENUM('male', 'female') NOT NULL,
            birthdate DATE NOT NULL,
            height_cm INT NOT NULL,
            weight_kg DECIMAL(5,2) NOT NULL,
            activity_level ENUM('sedentary','light','moderate','active','very_active') NOT NULL,
            goal ENUM('lose','maintain','gain') NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_profile_user
            FOREIGN KEY (user_id) REFERENCES users(id)
                                                           ON DELETE CASCADE
            );
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS daily_calorie_targets (
                                                             id INT AUTO_INCREMENT PRIMARY KEY,
                                                             user_id INT NOT NULL,
                                                             day DATE NOT NULL,
                                                             target_calories INT NOT NULL,
                                                             profile_updated_at TIMESTAMP NOT NULL,
                                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                             UNIQUE KEY unique_user_day (user_id, day),
            CONSTRAINT fk_targets_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
            );
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS foods (
                                             id INT AUTO_INCREMENT PRIMARY KEY,
                                             name VARCHAR(100) NOT NULL,
            calories_per_100g INT NOT NULL,
            protein_per_100g DECIMAL(5,2),
            carbs_per_100g DECIMAL(5,2),
            fat_per_100g DECIMAL(5,2),
            created_by_user_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_food_owner
            FOREIGN KEY (created_by_user_id) REFERENCES users(id)
            );
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS food_entries (
                                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                                    user_id INT NOT NULL,
                                                    food_id INT NOT NULL,
                                                    day DATE NOT NULL,
                                                    quantity_g INT NOT NULL,
                                                    calories INT NOT NULL,
                                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                    INDEX idx_food_user_day (user_id, day),
            CONSTRAINT fk_food_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE,
            CONSTRAINT fk_food_catalog
            FOREIGN KEY (food_id) REFERENCES foods(id)
            );
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS user_admin_messages (
                                                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                           sender_user_id INT NOT NULL,
                                                           receiver_admin_id INT NULL,
                                                           title VARCHAR(120),
            body TEXT NOT NULL,

            is_read TINYINT(1) NOT NULL DEFAULT 0,
            read_at TIMESTAMP NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            INDEX idx_sender (sender_user_id),
            INDEX idx_receiver (receiver_admin_id),
            INDEX idx_is_read (is_read),

            CONSTRAINT fk_uam_sender
            FOREIGN KEY (sender_user_id) REFERENCES users(id)
            ON DELETE CASCADE,

            CONSTRAINT fk_uam_receiver
            FOREIGN KEY (receiver_admin_id) REFERENCES users(id)
            ON DELETE SET NULL
            );
    `);

    const [roleCols] = await pool.query<any[]>(`SHOW COLUMNS FROM users LIKE 'role'`);

    if (roleCols.length === 0) {
        await run(`
            ALTER TABLE users
                ADD role ENUM('admin','user') NOT NULL DEFAULT 'user';
        `);
        console.log("✅ Coluna 'role' criada");
    }

    await run(`
      CREATE TABLE IF NOT EXISTS broadcast_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS user_broadcast_status (
        user_id INT NOT NULL,
        message_id BIGINT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, message_id),
        INDEX idx_ubs_message (message_id),
        CONSTRAINT fk_ubs_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_ubs_message
          FOREIGN KEY (message_id) REFERENCES broadcast_messages(id)
          ON DELETE CASCADE
      );
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS broadcast_replies (
        id BIGINT NOT NULL AUTO_INCREMENT,
        message_id BIGINT NOT NULL,
        replied_by_user_id INT NOT NULL,
        body TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_reply_message_id (message_id),
        KEY idx_reply_user_id (replied_by_user_id),
        CONSTRAINT fk_reply_message
        FOREIGN KEY (message_id)
        REFERENCES broadcast_messages(id)
        ON DELETE CASCADE,
        CONSTRAINT fk_reply_user
        FOREIGN KEY (replied_by_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      );
    `);

    await run(`
  CREATE TABLE IF NOT EXISTS broadcast_likes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    message_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uniq_like_message_user (message_id, user_id),

    KEY idx_like_message_id (message_id),
    KEY idx_like_user_id (user_id),
    KEY idx_like_message_created (message_id, created_at),

    CONSTRAINT fk_like_message
      FOREIGN KEY (message_id)
      REFERENCES broadcast_messages(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_like_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);

    await run(`
  CREATE TABLE IF NOT EXISTS nutrition_assessments (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      created_by_admin_id INT NULL,
      source ENUM('user','admin') NOT NULL DEFAULT 'user',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_assess_user_created (user_id, created_at),

      CONSTRAINT fk_assess_user
      FOREIGN KEY (user_id) REFERENCES users(id)
                                                              ON DELETE CASCADE,

      CONSTRAINT fk_assess_admin
      FOREIGN KEY (created_by_admin_id) REFERENCES users(id)
                                                              ON DELETE SET NULL
  );
`);

    await run(`
  CREATE TABLE IF NOT EXISTS assessment_personal (
      assessment_id BIGINT PRIMARY KEY,
      full_name VARCHAR(120) NULL,
      email VARCHAR(120) NULL,
      phone VARCHAR(30) NULL,

      sex ENUM('male','female') NULL,
      birthdate DATE NULL,

      height_cm INT NULL,
      weight_kg DECIMAL(5,2) NULL,

      CONSTRAINT fk_ap_assessment
      FOREIGN KEY (assessment_id) REFERENCES nutrition_assessments(id)
      ON DELETE CASCADE
  );
`);

    await run(`
  CREATE TABLE IF NOT EXISTS assessment_measurements (
      assessment_id BIGINT PRIMARY KEY,

       waist_cm INT NULL,
       hip_cm INT NULL,
       arm_cm INT NULL,
       thigh_cm INT NULL,
       calf_cm INT NULL,
       neck_cm INT NULL,

        CONSTRAINT fk_am_assessment
        FOREIGN KEY (assessment_id) REFERENCES nutrition_assessments(id)
      ON DELETE CASCADE
  );
`);

    await run(`
  CREATE TABLE IF NOT EXISTS assessment_goals (
       assessment_id BIGINT PRIMARY KEY,
    
      primary_goal ENUM('lose_fat','gain_muscle','maintain_health','recomp','performance') NOT NULL,
      target_weight_kg DECIMAL(5,2) NULL,

      deadline_weeks INT NULL,
      deadline_date DATE NULL,

      CONSTRAINT fk_ag_assessment
      FOREIGN KEY (assessment_id) REFERENCES nutrition_assessments(id)
      ON DELETE CASCADE
  );
`);

    await run(`
      CREATE TABLE IF NOT EXISTS assessment_activity (
          assessment_id BIGINT PRIMARY KEY,

          activity_level ENUM('sedentary','light','moderate','active','very_active','athlete') NOT NULL,
          currently_training ENUM('yes','no','stopped_recently') NOT NULL,
          training_frequency_per_week TINYINT NULL,
          notes TEXT NULL,

          CONSTRAINT fk_aa_assessment
          FOREIGN KEY (assessment_id) REFERENCES nutrition_assessments(id)
          ON DELETE CASCADE
  );
`);

    await run(`
      CREATE TABLE IF NOT EXISTS training_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(40) NOT NULL UNIQUE,
        label VARCHAR(60) NOT NULL
  );
`);

    await run(`
      CREATE TABLE IF NOT EXISTS assessment_activity_types (
          assessment_id BIGINT NOT NULL,
          training_type_id INT NOT NULL,

          PRIMARY KEY (assessment_id, training_type_id),

          INDEX idx_aat_type (training_type_id),

          CONSTRAINT fk_aat_assessment
          FOREIGN KEY (assessment_id) REFERENCES nutrition_assessments(id)
          ON DELETE CASCADE,

          CONSTRAINT fk_aat_type
          FOREIGN KEY (training_type_id) REFERENCES training_types(id)
          ON DELETE RESTRICT
  );
`);

    await run(`
      CREATE TABLE IF NOT EXISTS dietary_restrictions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(40) NOT NULL UNIQUE,
          label VARCHAR(60) NOT NULL
  );
`);

    await run(`
      CREATE TABLE IF NOT EXISTS assessment_restrictions (
          assessment_id BIGINT NOT NULL,
          restriction_id INT NOT NULL,

          PRIMARY KEY (assessment_id, restriction_id),

          INDEX idx_ar_restriction (restriction_id),

          CONSTRAINT fk_ar_assessment
          FOREIGN KEY (assessment_id) REFERENCES nutrition_assessments(id)
          ON DELETE CASCADE,

          CONSTRAINT fk_ar_restriction
          FOREIGN KEY (restriction_id) REFERENCES dietary_restrictions(id)
          ON DELETE RESTRICT
  );
`);


    await run(`
      CREATE TABLE IF NOT EXISTS assessment_nutrition (
          ssessment_id BIGINT PRIMARY KEY,

          allergies_text TEXT NULL,
          intolerances_text TEXT NULL,
          preferences_aversions_text TEXT NULL,

          meals_per_day TINYINT NULL,
          water_intake_liters DECIMAL(3,1) NULL,
          alcohol_intake ENUM('none','rare','weekends','weekly','daily') NULL,
          past_diets_text TEXT NULL,

          CONSTRAINT fk_an_assessment
          FOREIGN KEY (assessment_id) REFERENCES nutrition_assessments(id)
          ON DELETE CASCADE
  );
`);

    await run(`
      CREATE TABLE IF NOT EXISTS assessment_health (
          assessment_id BIGINT PRIMARY KEY,

          conditions_text TEXT NULL,
          medications_text TEXT NULL,
          surgeries_text TEXT NULL,
          supplements_text TEXT NULL,

          CONSTRAINT fk_ah_assessment
          FOREIGN KEY (assessment_id) REFERENCES nutrition_assessments(id)
          ON DELETE CASCADE
  );
`);

    await run(`
      CREATE TABLE IF NOT EXISTS assessment_routine (
         assessment_id BIGINT PRIMARY KEY,

         wake_time TIME NULL,
         sleep_time TIME NULL,
         sleep_hours DECIMAL(3,1) NULL,

          occupation VARCHAR(120) NULL,
          work_schedule_text VARCHAR(255) NULL,

          stress_level ENUM('low','moderate','high','very_high') NULL,
          additional_notes TEXT NULL,

          CONSTRAINT fk_arou_assessment
          FOREIGN KEY (assessment_id) REFERENCES nutrition_assessments(id)
          ON DELETE CASCADE
  );
`);





}
