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

app.use('/uploads', express.static('uploads'));
app.use(express.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const multer = require('multer');
const path = require('path');

// Konfiguracja folderu na przesyłane pliki
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../frontend/src/assets'); // Folder, w którym będą zapisywane pliki
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Middleware `multer`
const upload = multer({ storage });

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
        return res.status(403).json(
            { message: "Nie możesz odwiedzić tej strony, będąc zalogowanym." });
    }
    next();
}

function checkSession(req, res, next) {
    console.log("Sesja w aplikacji:", req.session); // Dodaj logowanie sesji w aplikacji
    if (!req.session || !req.session.users || !req.session.users.user_id) {
        return res.status(401).json(
            { message: 'Niezalogowany dostęp zabroniony' });
    }
    next();
}

function checkAdminSession(req, res, next) {
    console.log('Sprawdzanie roli administratora:', req.session?.users?.role);
    if (!req.session || !req.session.users || req.session.users.role !== 'admin') {
        return res.status(403).json({ message: "Brak dostępu. Musisz być administratorem." });
    }
    next();
}

app.get('/checkSession', (req, res) => {
    if (req.session && req.session.users && req.session.users.user_id) {
        return res.status(200).json({
            loggedIn: true,
            role: req.session.users.role,
            name: req.session.users.name, 
        });
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

    db.get('SELECT * FROM users WHERE mail = ?', [email], (err, user) => {
        if (err) {
            console.error('Błąd podczas sprawdzania użytkownika:', err);
            return res.status(500).send({ error: 'Błąd serwera' });
        }

        if (!user) {
            return res.status(404).send({ message: 'Użytkownik nie istnieje' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiration = new Date(Date.now() + 3600 * 1000); 

        db.run(
            'UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE mail = ?',
            [token, expiration, email],
            (err) => {
                if (err) {
                    console.error('Błąd podczas zapisywania tokenu:', err);
                    return res.status(500).send({ error: 'Błąd serwera' });
                }

                const transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'natalia.konopka213@gmail.com',
                        pass: 'fclu jeml wsrg zntr' 
                    },
                    tls: {
                        rejectUnauthorized: false 
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
app.post('/adoptions', checkSession, checkAdminSession, (req, res) => {
    const { dog_name, form_date, ba_note, walks_amount, estimated_adoption_date } = req.body;

    if (!dog_name || !form_date || !ba_note || !walks_amount || !estimated_adoption_date) {
        return res.status(400).json({ error: 'Wszystkie pola są wymagane!' });
    }

    const getDogIdSQL = 'SELECT dog_id FROM dogs WHERE name = ?';
    const insertAdoptionSQL = `
        INSERT INTO adoptions (dog_id, form_date, ba_note, walks_amount, estimated_adoption_date)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.get(getDogIdSQL, [dog_name], (err, row) => {
        if (err) {
            console.error('Błąd przy wyszukiwaniu ID psa:', err);
            return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Nie znaleziono psa o podanym imieniu' });
        }

        const dog_id = row.dog_id;

        db.run(insertAdoptionSQL, [dog_id, form_date, ba_note, walks_amount, estimated_adoption_date], function (err) {
            if (err) {
                console.error('Błąd przy dodawaniu procesu adopcyjnego:', err);
                return res.status(500).json({ error: 'Błąd serwera' });
            }
            res.status(201).json({ message: 'Proces adopcyjny został dodany', adoption_id: this.lastID });
        });
    });
});

app.put('/adoptions/:dog_id', checkSession, checkAdminSession, (req, res) => {
    const { dog_id } = req.params;
    const { form_date, ba_note, walks_amount, estimated_adoption_date } = req.body;

    const sql = `
        UPDATE adoptions
        SET form_date = ?, ba_note = ?, walks_amount = ?, estimated_adoption_date = ?
        WHERE dog_id = ?
    `;

    db.run(sql, [form_date, ba_note, walks_amount, estimated_adoption_date, dog_id], function (err) {
        if (err) {
            console.error("Błąd podczas aktualizacji danych adopcyjnych:", err);
            return res.status(500).json({ error: "Błąd serwera" });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Nie znaleziono procesu adopcyjnego" });
        }
        res.json({ message: "Proces adopcyjny zaktualizowany" });
    });
});

app.get('/adoptions', checkSession, (req, res) => {
    const sql = `
        SELECT a.dog_id, d.name AS dog_name
        FROM adoptions a
        JOIN dogs d ON a.dog_id = d.dog_id
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Błąd bazy danych:', err.message);
            return res.status(500).json({ error: 'Błąd serwera' });
        }
        res.json(rows);
    });
});


app.get('/adoptions/:dog_id', checkSession, (req, res) => {
    const { dog_id } = req.params;

    const sql = `
        SELECT 
            a.adoption_id, 
            a.form_date, 
            a.ba_note, 
            a.walks_amount, 
            a.estimated_adoption_date,
            d.name AS dog_name,
            d.box AS dog_box
        FROM adoptions a
        JOIN dogs d ON a.dog_id = d.dog_id
        WHERE a.dog_id = ?;
    `;

    db.get(sql, [dog_id], (err, row) => {
        if (err) {
            console.error("Błąd pobierania danych adopcyjnych:", err);
            return res.status(500).json({ error: "Błąd serwera" });
        }
        if (!row) {
            return res.status(404).json({ message: "Brak danych o procesie adopcji dla tego psa" });
        }
        res.json(row);
    });
});

app.get('/home',checkSession,(req,res) =>{
    res.send('Procesy adopcyjne');
});

app.post('/newPassword', checkIfLogged, async (req, res) => {
    const { password, token } = req.body;

    if (!password || !token) {
        return res.status(400).json({ error: "Hasło i token są wymagane!" });
    }

    try {
        // Znalezienie użytkownika na podstawie tokenu
        db.get('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiration > ?', [token, new Date()], async (err, row) => {
            if (err) {
                console.error("Błąd bazy danych:", err);
                return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
            }

            if (!row) {
                return res.status(404).json({ error: "Nieprawidłowy lub wygasły token" });
            }

            // Hashowanie nowego hasła
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Aktualizacja hasła w bazie danych
            db.run('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE user_id = ?', [hashedPassword, row.user_id], (err) => {
                if (err) {
                    console.error("Błąd aktualizacji hasła:", err);
                    return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
                }

                res.status(200).json({ message: "Hasło zostało zmienione!" });
            });
        });
    } catch (error) {
        console.error("Błąd podczas zmiany hasła:", error);
        res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    }
});

app.post('/dogs', checkSession, checkAdminSession, upload.single('image'), (req, res) => {
    const { name, weight, age, box, arrived, work } = req.body;
    const imagePath = req.file ? req.file.path : null; // Ścieżka do obrazu

    const sql = `INSERT INTO dogs (name, weight, age, box, arrived, work, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [name, weight, age, box, arrived, work, imagePath], function (err) {
        if (err) {
            console.error('Błąd przy dodawaniu psa:', err);
            return res.status(500).json({ error: 'Błąd serwera' });
        }
        res.status(201).json({ message: 'Pies został dodany', dog_id: this.lastID });
    });
});

app.put('/dogs/:dog_id', checkSession, checkAdminSession, (req, res) => {
    const { dog_id } = req.params;
    const { name, weight, age, box, arrived, work } = req.body;

    const sql = `UPDATE dogs SET name = ?, weight = ?, age = ?, box = ?, arrived = ?, work = ? WHERE dog_id = ?`;
    db.run(sql, [name, weight, age, box, arrived, work, dog_id], function (err) {
        if (err) {
            console.error('Błąd przy edycji psa:', err);
            return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Nie znaleziono psa' });
        }
        res.json({ message: 'Dane psa zostały zaktualizowane' });
    });
});
app.delete('/adoptions/:dog_id', checkSession, checkAdminSession, (req, res) => {
    const { dog_id } = req.params;

    const sql = `DELETE FROM adoptions WHERE dog_id = ?`;
    db.run(sql, [dog_id], function (err) {
        if (err) {
            console.error('Błąd przy usuwaniu procesu adopcyjnego:', err);
            return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Nie znaleziono procesu adopcyjnego' });
        }
        res.json({ message: 'Proces adopcyjny został usunięty' });
    });
});
app.delete('/dogs/:dog_id', checkSession, checkAdminSession, (req, res) => {
    const { dog_id } = req.params;

    const sql = `DELETE FROM dogs WHERE dog_id = ?`;
    db.run(sql, [dog_id], function (err) {
        if (err) {
            console.error('Błąd przy usuwaniu psa:', err);
            return res.status(500).json({ error: 'Błąd serwera' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Nie znaleziono psa' });
        }
        res.json({ message: 'Pies został usunięty' });
    });
});

app.get('/dogs', checkSession, (req, res) => {
    const sql = 'SELECT dog_id, name, weight, age, box, arrived, work, image_path FROM dogs'; 
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
            if (!row.is_approved) {
                return res.status(403).json({ message: "Twoje konto nie zostało jeszcze zatwierdzone przez administratora." });
            }
            const match = await bcrypt.compare(password, row.password);
            if (match) {
                req.session.users = {
                    user_id: row.user_id,
                    name: row.name,
                    surname: row.surname,
                    role: row.role 
                };
                return res.status(200).json({ message: "Zalogowano pomyślnie" });
            } else {
                return res.status(401).json({ message: "Niepoprawne hasło" });
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
        const saltRounds = 10; 
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = `INSERT INTO users (name, surname, mail, login, password, is_approved) VALUES (?, ?, ?, ?, ?, 0)`;
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

app.get('/pendingUsers', checkSession, checkAdminSession, (req, res) => {
    const sql = `SELECT user_id, name, surname, mail FROM users WHERE is_approved = 0`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Błąd podczas pobierania użytkowników:", err);
            return res.status(500).json({ error: "Błąd serwera" });
        }
        res.json(rows);
    });
});
app.delete('/rejectUser', checkSession, checkAdminSession, (req, res) => {
    console.log('Otrzymane dane do odrzucenia:', req.body);
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "ID użytkownika jest wymagane" });
    }

    const sql = `DELETE FROM users WHERE user_id = ? AND is_approved = 0`;
    db.run(sql, [userId], function (err) {
        if (err) {
            console.error("Błąd podczas usuwania użytkownika:", err);
            return res.status(500).json({ error: "Błąd serwera" });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Nie znaleziono użytkownika" });
        }
        res.json({ message: "Użytkownik został usunięty" });
    });
});

app.post('/approveUser', checkSession, checkAdminSession, (req, res) => {
    console.log('Otrzymane dane:', req.body);
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "ID użytkownika jest wymagane" });
    }

    const sql = `UPDATE users SET is_approved = 1 WHERE user_id = ?`;
    db.run(sql, [userId], function (err) {
        if (err) {
            console.error("Błąd podczas zatwierdzania użytkownika:", err);
            return res.status(500).json({ error: "Błąd serwera" });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Nie znaleziono użytkownika" });
        }
        res.json({ message: "Użytkownik został zatwierdzony" });
    });
});

if (require.main === module) {
    const port = 3000;
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
}
module.exports = app;
