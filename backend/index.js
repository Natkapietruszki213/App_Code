const express = require('express')
const cors = require('cors')
const db = require('./database')
const router = express.Router()
const app = express()
const port = 3000
const session = require('express-session')

app.use(express.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const corsOptions = {
    origin: 'http://localhost:5173',  
    credentials: true,  // Umożliwia wysyłanie credentialek, takich jak ciasteczka i nagłówki autoryzacyjne
    optionsSuccessStatus: 200 // niektóre przeglądarki (np. IE11, różne smartfony) wymagają tego ustawienia
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true, // Zapewnia, że ciasteczko nie będzie dostępne w JavaScript
        secure: false, // Ważne: Musi być false dla HTTP
        sameSite: 'Lax', // Zapewnia działanie w lokalnym środowisku
        maxAge: 1000 * 60 * 60 // Opcjonalnie: czas życia ciasteczka (np. 1 godzina)
    }
}));

function checkSession(req,res,next){
    if (!req.session || !req.session.users || !req.session.users.user_id) {
        return res.status(401).json({ message: 'Niezalogowany dostęp zabroniony' });
    }
    next();
}

app.get('/login', (req, res) => {
    res.send('Strona logowania'); 
});

app.get('/home', checkSession, (req, res) => {
    res.send('Strona główna');
});

app.get('/walks', checkSession, (req, res) => {
    res.json({ message: 'Spacery' }); 
});

app.post('/walks', (req, res) => {
    const { date, selectedDogs } = req.body;

    if (!date || !Array.isArray(selectedDogs)) {
        return res.status(400).send({ error: 'Błędne dane wejściowe' });
    }

    const insertSQL = 'INSERT INTO walk (date, dog_name) VALUES (?, ?)';
    const db = require('./database'); 

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        try {
            selectedDogs.forEach(dog => {
                db.run(insertSQL, [date, dog], (err) => {
                    if (err) {
                        throw err; 
                    }
                });
            });
            db.run('COMMIT', (err) => {
                if (err) {
                    throw err; 
                }
                res.status(201).send({ message: 'Spacery zostały dodane' });
            });
        } catch (error) {
            console.error('Błąd podczas zapisu do bazy:', error);
            db.run('ROLLBACK'); 
            res.status(500).send({ error: 'Błąd bazy danych' });
        }
    });
});

app.get('/statistics',checkSession, (req, res) => {
    const sql = `
        SELECT 
            dogs.name AS dog_name, 
            MAX(walk.date) AS last_walk_date
        FROM 
            dogs
        LEFT JOIN 
            walk 
        ON 
            dogs.name = walk.dog_name
        GROUP BY 
            dogs.name
    `;

    const db = require('./database'); 

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Błąd podczas pobierania statystyk:', err.message);
            res.status(500).json({ error: 'Błąd serwera' });
            return;
        }
        const today = new Date();

        const statistics = rows.map(row => {
            console.log('Raw last_walk_date:', row.last_walk_date); 
            let daysAgo = null;

        if (row.last_walk_date) {
            try {
                const [day, month, year] = row.last_walk_date.split('-');
                const formattedDate = `${year}-${month}-${day}`;
                const lastWalkDate = new Date(`${formattedDate}`); 

                console.log('Parsed lastWalkDate:', lastWalkDate);
                if (isNaN(lastWalkDate)) {
                    throw new Error('Invalid Date Format');
                }

                const differenceInTime = today.getTime() - lastWalkDate.getTime(); 
                daysAgo = Math.floor(differenceInTime / (1000 * 60 * 60 * 24)); 
            } catch (error) {
                console.error('Error parsing date:', error.message);
            }
        }

        return {
            dog_name: row.dog_name,
            last_walk_date: row.last_walk_date || 'brak',
            days_ago: daysAgo !== null ? daysAgo : 'brak'
        };
});
        console.log('Obliczone statystyki:', statistics);
        res.json(statistics);
    });
});

app.get('/adoptions',checkSession,(req,res) =>{
    res.send('Procesy adopcyjne');
});

app.get('/dogs', (req, res) => {
    const sql = 'SELECT name FROM dogs'; 
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Błąd podczas wykonywania zapytania:', err.message);
            res.status(500).json({ error: 'Błąd serwera' });
            return;
        }
        res.json(rows); 
    });
});

app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error("Błąd podczas niszczenia sesji:", err);
                return res.status(500).send('Błąd podczas wylogowywania');
            }
            res.clearCookie('connect.sid', {
                path: '/', // Ścieżka musi odpowiadać konfiguracji ciasteczka
                httpOnly: true, 
                secure: false, // False, jeśli używasz HTTP
                sameSite: 'Lax' // Dopasowanie do konfiguracji
            });
            console.log("Sesja zniszczona i ciasteczko usunięte.");
            res.status(200).send('Wylogowano pomyślnie');
        });
    } else {
        res.status(200).send('Nie zalogowano');
    }
});

app.post('/login', (req, res) => {
    console.log("Request body:", req.body);
    const {name, password } = req.body;
    db.get('SELECT * FROM users WHERE login = ?', [name], (err, row) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
        if (row) {
            if (password === row.password) {
                req.session.users = {
                    user_id: row.user_id,
                    name: row.name,
                    surname: row.surname,
                };
                console.log("Zalogowano pomyślnie:", name);
                return res.status(200).json({ message: "Zalogowano pomyślnie" });
            } else {
                return res.status(401).json({ message: "Niepoprawne hasło" });
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
