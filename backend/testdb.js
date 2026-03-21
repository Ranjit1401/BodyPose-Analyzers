const pool = require("./config/db");

async function createTable() {
  try {

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        goal VARCHAR(100),
        total_workouts INTEGER DEFAULT 0,
        avg_accuracy INTEGER DEFAULT 0,
        total_calories INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        last_login_date DATE
      )
    `);

    console.log("Users table created");

  } catch (error) {
    console.error(error);
  }
}

createTable();