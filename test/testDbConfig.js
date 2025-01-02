// test/testDbConfig.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ścieżka do bazy testowej
const testDbPath = path.resolve(__dirname, '../db/test_base.db');

// Połączenie z bazą danych testową
const db = new sqlite3.Database(testDbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Błąd połączenia z bazą danych testową:', err);
    } else {
        console.log('Połączono z bazą danych testową.');
    }
});

module.exports = db;
