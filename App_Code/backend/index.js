const express = require('express')
var cors = require('cors')

const app = express()
const port = 3000

app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/dogs', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ a: 1 }));
  })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
