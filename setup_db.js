const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'hangout_spots',
});

console.log('Setting up database tables...');

// Read and execute the SQL file
fs.readFile('setup_database.sql', 'utf8', (err, sql) => {
    if (err) {
        console.error('Error reading SQL file:', err);
        return;
    }

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    let completed = 0;
    let total = statements.length;

    statements.forEach((statement, index) => {
        db.query(statement.trim(), (err, results) => {
            if (err) {
                console.error(`Error executing statement ${index + 1}:`, err.message);
            } else {
                console.log(`✅ Statement ${index + 1} executed successfully`);
            }
            
            completed++;
            if (completed === total) {
                console.log('\n🎉 Database setup complete!');
                console.log('Tables created:');
                db.query('SHOW TABLES', (err, tables) => {
                    if (err) {
                        console.error('Error showing tables:', err);
                    } else {
                        tables.forEach(table => {
                            console.log(`- ${Object.values(table)[0]}`);
                        });
                    }
                    db.end();
                });
            }
        });
    });
});



