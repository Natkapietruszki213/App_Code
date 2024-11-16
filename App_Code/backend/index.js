const express = require('express')
var cors = require('cors')
const db = require('./database')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('./models/User')
const cookieParser = require("cookie-parser")

const app = express()
const port = 3000

app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get('/dogs', (req, res) => {
  db.all('SELECT * FROM dogs', [], (err, rows) => {
    if (err) {
        res.status(400).send({ error: err.message });
        return;
    }
    res.status(200).json({
        users: rows
    });
});
});

app.post('/signUp', (req, res) => {
  const {name, surname, email, login, password} = req.body;
  const sql = `INSERT INTO users (name, surname, mail, login, hash_password) VALUES (?, ?, ?, ?, ?)`;

  db.run(sql, [name, surname, email, login, password], function(err) {
    if (err) {
        console.error("SQL error:", err);
        return res.status(400).json({error: err.message});
    }
    res.json({id: this.lastID});
});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
