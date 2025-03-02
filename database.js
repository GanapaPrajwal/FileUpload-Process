const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "password",
    database: process.env.DB_NAME || "image_processing"
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL Database");
    
    db.query(`
        CREATE TABLE IF NOT EXISTS requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            request_id VARCHAR(255) UNIQUE,
            status VARCHAR(50),
            input_csv TEXT,
            output_csv TEXT
        )
    `);
});

module.exports = { db };
