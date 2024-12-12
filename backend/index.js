const express = require('express')
const cors = require('cors')
const db = require('./database')
const router = express.Router()
const app = express()
const port = 3000
const session = require('express-session')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const bcrypt = require('bcrypt');


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

function checkIfLogged(req, res, next) {
    if (req.session && req.session.users && req.session.users.user_id) {
        return res.status(403).json({ message: "Nie możesz odwiedzić tej strony, będąc zalogowanym." });
    }
    next();
}

function checkSession(req,res,next){
    if (!req.session || !req.session.users || !req.session.users.user_id) {
        return res.status(401).json({ message: 'Niezalogowany dostęp zabroniony' });
    }
    next();
}
app.get('/checkSession', (req, res) => {
    if (req.session && req.session.users && req.session.users.user_id) {
        return res.status(200).json({ loggedIn: true });
    }
    res.status(200).json({ loggedIn: false });
});

app.get('/walks', checkSession, (req, res) => {
    res.json({ message: 'Spacery' }); 
});

app.post('/walks', (req, res) => {
    const { date, selectedDogs } = req.body;
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const insertSQL = 'INSERT INTO walk (date, dog_name) VALUES (?, ?)';
    const db = require('./database'); 

    if (!date || !Array.isArray(selectedDogs)) {
        return res.status(400).send({ error: 'Błędne dane wejściowe' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        try {
            selectedDogs.forEach(dog => {
                db.run(insertSQL, [formattedDate, dog], (err) => {
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

app.post('/forgotPassword', checkIfLogged, (req, res) => {
    const { email } = req.body;

    // Sprawdź, czy użytkownik istnieje w bazie danych
    db.get('SELECT * FROM users WHERE mail = ?', [email], (err, user) => {
        if (err) {
            console.error('Błąd podczas sprawdzania użytkownika:', err);
            return res.status(500).send({ error: 'Błąd serwera' });
        }

        if (!user) {
            return res.status(404).send({ message: 'Użytkownik nie istnieje' });
        }

        // Wygeneruj unikalny token
        const token = crypto.randomBytes(32).toString('hex');
        const expiration = new Date(Date.now() + 3600 * 1000); // Token ważny przez 1 godzinę

        // Zapisz token w bazie danych
        db.run(
            'UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE mail = ?',
            [token, expiration, email],
            (err) => {
                if (err) {
                    console.error('Błąd podczas zapisywania tokenu:', err);
                    return res.status(500).send({ error: 'Błąd serwera' });
                }

                // Wyślij e-mail do użytkownika
                const transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'natalia.konopka213@gmail.com',
                        pass: 'fclu jeml wsrg zntr' // Wprowadź tutaj hasło aplikacji
                    },
                    tls: {
                        rejectUnauthorized: false // Wyłącza weryfikację certyfikatu
                    }
                });
                

                const resetLink = `http://localhost:5173/newPassword?token=${token}`;
                const mailOptions = {
                    from: 'natalia.konopka213@gmail.com',
                    to: email,
                    subject: 'Resetowanie hasła',
                    text: `Kliknij w poniższy link, aby zresetować swoje hasło:\n\n${resetLink}`,
                    html: `<p>Kliknij w poniższy link, aby zresetować swoje hasło:</p><a href="${resetLink}">${resetLink}</a>`
                };

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.error('Błąd podczas wysyłania e-maila:', err);
                        return res.status(500).send({ error: 'Nie udało się wysłać e-maila' });
                    }

                    console.log('E-mail wysłany:', info.response);
                    res.status(200).send({ message: 'E-mail z linkiem resetującym został wysłany' });
                });
            }
        );
    });
});

app.get('/statistics', checkSession, (req, res) => {
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

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Błąd podczas pobierania statystyk:', err.message);
            res.status(500).json({ error: 'Błąd serwera' });
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Wyzerowanie godzin, minut i sekund

        const parseDateAsLocal = (dateString) => {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day); // Tworzy lokalną datę bez przesunięcia UTC
        };

        const statistics = rows.map(row => {
            console.log('Raw last_walk_date:', row.last_walk_date); 
            let daysAgo = null;

            if (row.last_walk_date) {
                try {
                    const lastWalkDate = parseDateAsLocal(row.last_walk_date);

                    console.log('Parsed lastWalkDate:', lastWalkDate);
                    if (isNaN(lastWalkDate)) {
                        throw new Error('Invalid Date Format');
                    }

                    const differenceInTime = today - lastWalkDate; 
                    daysAgo = Math.floor(differenceInTime / (1000 * 60 * 60 * 24)); // Różnica w dniach
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

app.get('/statistics', checkSession, (req, res) => {
    console.log('Sesja użytkownika:', req.session);
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

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Błąd podczas pobierania statystyk:', err.message);
            res.status(500).json({ error: 'Błąd serwera' });
            return;
        }

        console.log('Pobrane dane z bazy:', rows);

        const statistics = rows.map(row => {
            let daysAgo = 'brak';
            if (row.last_walk_date) {
                const lastWalkDate = new Date(row.last_walk_date);
                const today = new Date();
                const diffTime = today - lastWalkDate;
                daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
            return {
                dog_name: row.dog_name,
                last_walk_date: row.last_walk_date || 'brak',
                days_ago: daysAgo
            };
        });

        res.json(statistics);
    });
});

app.get('/adoptions',checkSession,(req,res) =>{
    res.send('Procesy adopcyjne');
});
app.get('/home',checkSession,(req,res) =>{
    res.send('Procesy adopcyjne');
});

app.post('/newPassword', checkIfLogged, async (req, res) => {
    const { password, token } = req.body;

    // Sprawdź, czy otrzymano wymagane dane
    if (!password || !token) {
        return res.status(400).json({ error: "Hasło i token są wymagane!" });
    }

    try {
        // Znajdź użytkownika na podstawie tokena
        db.get(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiration > ?',
            [token, new Date()],
            async (err, user) => {
                if (err) {
                    console.error("Błąd bazy danych:", err);
                    return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
                }

                // Sprawdź, czy użytkownik istnieje i token jest ważny
                if (!user) {
                    return res.status(400).json({ error: "Nieprawidłowy lub wygasły token!" });
                }

                // Zhashuj nowe hasło
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                // Zaktualizuj hasło w bazie danych
                db.run(
                    'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE reset_token = ?',
                    [hashedPassword, token],
                    function (updateErr) {
                        if (updateErr) {
                            console.error("Błąd aktualizacji hasła:", updateErr);
                            return res.status(500).json({ error: "Nie udało się zaktualizować hasła" });
                        }

                        if (this.changes === 0) {
                            console.error("Nie znaleziono użytkownika z podanym tokenem.");
                            return res.status(400).json({ error: "Nie znaleziono użytkownika z podanym tokenem" });
                        }

                        res.status(200).json({ message: "Hasło zostało zaktualizowane!" });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Błąd podczas zmiany hasła:", error);
        res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    }
});

app.get('/dogs', checkSession, (req, res) => {
    const sql = 'SELECT dog_id, name, weight, age, box, arrived, work FROM dogs'; 
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

app.get('/login',checkIfLogged, (req, res) => {
    res.send('Strona logowania'); 
});

app.post('/login', checkIfLogged, (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ error: "Podaj login i hasło" });
    }

    db.get('SELECT * FROM users WHERE login = ?', [name], async (err, row) => {
        if (err) {
            console.error("Błąd bazy danych:", err);
            return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
        }
        if (row) {
            try {
                const match = await bcrypt.compare(password, row.password);
                if (match) {
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
            } catch (error) {
                console.error("Błąd podczas weryfikacji hasła:", error);
                return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
            }
        } else {
            return res.status(404).json({ message: "Użytkownik nie istnieje" });
        }
    });
});
  
  app.post('/signUp',checkIfLogged, async (req, res) => {
    const { name, surname, email, login, password } = req.body;

    if (!name || !surname || !email || !login || !password) {
        return res.status(400).json({ error: 'Wszystkie pola są wymagane!' });
    }

    try {
        const saltRounds = 10; // Liczba rund solenia
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = `INSERT INTO users (name, surname, mail, login, password) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [name, surname, email, login, hashedPassword], function (err) {
            if (err) {
                console.error("SQL error:", err);
                return res.status(400).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
    } catch (error) {
        console.error("Błąd hashowania hasła:", error);
        res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
