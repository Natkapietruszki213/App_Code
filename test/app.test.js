const request = require('supertest');
const app = require('../backend/index'); // Ścieżka do aplikacji
const db = require('../test/testDbConfig'); // Import testowej bazy danych
const bcrypt = require('bcrypt');
const saltRounds = 10;

describe('API Tests', () => {
    beforeAll(async () => {
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY, login TEXT NOT NULL, password TEXT NOT NULL, name TEXT NOT NULL, surname TEXT NOT NULL, mail TEXT NOT NULL, is_approved INTEGER NOT NULL DEFAULT 0, role TEXT DEFAULT `user`, reset_token TEXT, reset_token_expiration DATETIME)', (err) => {
                    if (err) reject(err);
                });

                db.run('CREATE TABLE IF NOT EXISTS walk (walk_id INTEGER PRIMARY KEY, date TEXT, dog_name TEXT)', (err) => {
                    if (err) reject(err);
                });

                db.run('CREATE TABLE IF NOT EXISTS dogs (dog_id INTEGER PRIMARY KEY, name TEXT NOT NULL, weight INTEGER, age INTEGER, box TEXT, arrived TEXT, work TEXT)', (err) => {
                    if (err) reject(err);
                });

                bcrypt.hash('Nath', saltRounds, (err, hashedPassword) => {
                    if (err) reject(err);
                    db.run('INSERT INTO users (login, password, name, surname, mail, is_approved, role) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                        ['Nath', hashedPassword, 'Nath', 'Nath', 'nath@example.com', 1, 'admin'], resolve);
                });
            });
        });

        // Mockowanie sesji
        app.use((req, res, next) => {
            req.session = {
                users: {
                    user_id: 1,
                    role: 'admin',
                },
            };
            next();
        });
    });

    it('should log in user with correct credentials', async () => {
        const response = await request(app)
            .post('/login')
            .send({ name: 'Nath', password: 'Nath' }); // Upewnij się, że używasz poprawnych kluczy

        console.log('Response for correct credentials:', response.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Zalogowano pomyślnie');
    });

    it('should return error for incorrect credentials', async () => {
        const response = await request(app)
            .post('/login')
            .send({ name: 'wronguser', password: 'wrongpassword' });

        console.log('Response for incorrect credentials:', response.body);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Użytkownik nie istnieje');
    });
     // Test: Dodawanie spacerów (POST /walks)
     it('should add walks for selected dogs', async () => {
        const response = await request(app)
            .post('/walks')
            .send({
                date: '2025-01-01',
                selectedDogs: ['Bobby', 'Rex']
            })
            .set('Cookie', 'connect.sid=<SESSION_COOKIE>');

        console.log('Response for adding walks:', response.body);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Spacery zostały dodane');
    });

    // Test: Błąd przy dodawaniu spacerów (zły format danych)
    it('should return error for bad input in walks', async () => {
        const response = await request(app)
            .post('/walks')
            .send({
                date: '2025-01-01',
                selectedDogs: 'Bobby'  // Błędny format, powinno być tablicą
            })
            .set('Cookie', 'connect.sid=<SESSION_COOKIE>');

        console.log('Response for bad input in walks:', response.body);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Błędne dane wejściowe');
    });

    // Test: Resetowanie hasła
    it('should send password reset email for valid user', async () => {
        const response = await request(app)
            .post('/forgotPassword')
            .send({ email: 'nath@example.com' })
            .set('Cookie', 'connect.sid=<SESSION_COOKIE>');

        console.log('Response for forgotPassword:', response.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'E-mail z linkiem resetującym został wysłany');
    });

    // Test: Błąd przy próbie resetowania hasła (nieistniejący użytkownik)
    it('should return error for non-existent user in forgotPassword', async () => {
        const response = await request(app)
            .post('/forgotPassword')
            .send({ email: 'wrongemail@example.com' })
            .set('Cookie', 'connect.sid=<SESSION_COOKIE>');

        console.log('Response for non-existent user:', response.body);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Użytkownik nie istnieje');
    });

    // Test: Pobieranie listy psów
    it('should fetch all dogs', async () => {
        // Dodanie testowego psa
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO dogs (name, weight, age, box, arrived, work) VALUES (?, ?, ?, ?, ?, ?)', 
                ['Buddy', 25, 4, 'A1', '2025-01-01', 'Therapy Dog'], (err) => {
                    if (err) reject(err);
                    resolve();
                });
        });

        const response = await request(app)
            .get('/dogs');

        console.log('Response for fetching dogs:', response.body);
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
    });

    // Test: Dodawanie psa
    it('should add a new dog', async () => {
        const response = await request(app)
            .post('/dogs')
            .set('Cookie', 'connect.sid=mockAdminSessionCookie')
            .send({
                name: 'Buddy',
                weight: 25,
                age: 4,
                box: 'A1',
                arrived: '2025-01-01',
                work: 'Therapy Dog'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Pies został dodany');
    });

    // Test: Aktualizacja danych psa
    it('should update dog details', async () => {
        const response = await request(app)
            .put('/dogs/1')
            .set('Cookie', 'connect.sid=mockAdminSessionCookie')
            .send({
                name: 'Buddy Updated',
                weight: 30,
                age: 5,
                box: 'A2',
                arrived: '2025-01-02',
                work: 'Service Dog'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Dane psa zostały zaktualizowane');
    });

    // Test: Usuwanie psa
    it('should delete a dog', async () => {
        const response = await request(app)
            .delete('/dogs/1')
            .set('Cookie', 'connect.sid=mockAdminSessionCookie');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Pies został usunięty');
    });

    // Test: Pobieranie spacerów
    it('should fetch walks', async () => {
        const response = await request(app)
            .get('/walks')
            .set('Cookie', 'connect.sid=mockSessionCookie');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Spacery');
    });

    // Test: Pobieranie statystyk
    it('should fetch statistics', async () => {
        const response = await request(app)
            .get('/statistics')
            .set('Cookie', 'connect.sid=mockSessionCookie');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    // Test: Pobieranie listy użytkowników oczekujących na zatwierdzenie
    it('should fetch pending users', async () => {
        const response = await request(app)
            .get('/pendingUsers')
            .set('Cookie', 'connect.sid=mockAdminSessionCookie');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    // Test: Zatwierdzanie użytkownika
    it('should approve a user', async () => {
        const response = await request(app)
            .post('/approveUser')
            .set('Cookie', 'connect.sid=mockAdminSessionCookie')
            .send({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Użytkownik został zatwierdzony');
    });


    it('should add a new dog', async () => {
        const response = await request(app)
            .post('/dogs')
            .set('Cookie', 'connect.sid=mockAdminSessionCookie')
            .send({
                name: 'Buddy',
                weight: 25,
                age: 4,
                box: 'A1',
                arrived: '2025-01-01',
                work: 'Therapy Dog'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Pies został dodany');
    });

    afterAll(async () => {
        await new Promise((resolve) => {
            db.close(resolve); // Zamknięcie połączenia z bazą danych
        });
    });
});
