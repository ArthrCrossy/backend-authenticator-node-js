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

async function run(query: string) {
    await pool.execute(query);
}

export async function createTables() {
    await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
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

    const [roleCols] = await pool.query<any[]>(`SHOW COLUMNS FROM users LIKE 'role'`);

    if (roleCols.length === 0) {
        await run(`
    ALTER TABLE users
      ADD role ENUM('admin','user') NOT NULL DEFAULT 'user';
  `);
        console.log("✅ Coluna 'role' criada");
    }
}
