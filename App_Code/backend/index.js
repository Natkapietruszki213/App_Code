const express = require('express')
var cors = require('cors')
const db = require('./database')
const router = express.Router()
const app = express()
const port = 3000

app.use(cors());
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

app.post('/login', (req, res) => {
    console.log("Request body:", req.body);
    const {name, password } = req.body;
    db.get('SELECT * FROM users WHERE name = ?', [name], (err, row) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
        if (row) {
            if (password === row.password) {
                console.log("Zalogowano pomyślnie:", name);
                return res.status(200).json({ message: "Zalogowano pomyślnie" }); 
            } else {
                return res.status(401).json({ message: "Niepoprawne hasło"});
            }
        } else {
            return res.status(404).json({ message: "Użytkownik nie istnieje"});
        }
    });
  });
  
app.post('/signUp', (req, res) => {
  const {name, surname, email, login, password} = req.body;
  const sql = `INSERT INTO users (name, surname, mail, login, password) VALUES (?, ?, ?, ?, ?)`;

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
