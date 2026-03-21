const fs = require("fs");
const pool = require("../backend/config/db");
async function initDB() {
  try {

    const sql = fs.readFileSync("./database/schema.sql").toString();

    await pool.query(sql);

    console.log("All tables created successfully");

  } catch (error) {
    console.error(error);
  }
}

initDB();