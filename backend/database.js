const path = require('path');
const sqlite3 = require('sqlite3').verbose();


const dbPath = path.resolve(__dirname, '../db/base.db');  
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Błąd podczas otwierania bazy danych', err);
    } else {
        console.log('Połączono z bazą danych.');
    }
});

module.exports = db;
