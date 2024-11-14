const express = require('express')
var cors = require('cors')
const db = require('./database')

const app = express()
const port = 3000

app.use(cors())

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
