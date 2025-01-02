// backend/database.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Zmienna, która będzie zawierała ścieżkę do testowej bazy danych
const dbPath = path.resolve(__dirname, '../db/test_base.db');  // Upewnij się, że używasz testowej bazy danych
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Błąd podczas otwierania bazy danych', err);
    } else {
        console.log('Połączono z bazą danych testową.');
    }
});

module.exports = db;
