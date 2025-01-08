const request = require('supertest');
const app = require('../backend/index'); 
const db = require('../backend/database');
const bcrypt = require('bcrypt');

// Add nodemailer mock
jest.mock('nodemailer');
const nodemailer = require('nodemailer');
const mockSendMail = jest.fn().mockImplementation((mailOptions, callback) => {
    callback(null, { response: 'Success' });
});
const mockTransporter = {
    sendMail: mockSendMail,
};
nodemailer.createTransport.mockReturnValue(mockTransporter);

describe('API Tests', () => {

  beforeAll((done) => {
    db.run(`INSERT INTO users (name, surname, login, password, role, mail, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        ['Test', 'User', 'TestowyUser', bcrypt.hashSync('password123', 10), 'user','testowy@testowymail.pl', 0 ], 
        done
    );
    db.run(`INSERT INTO adoptions (dog_id, form_date, ba_note, walks_amount, estimated_adoption_date) VALUES (?, ?, ?, ?, ?)`, 
        ['1', '2024-08-01', 'Test', '3', '2025-02-02'], 
        done
    );
  });

  afterAll((done) => {
    db.run(`DELETE FROM users WHERE login = ?`, ['TestowyUser'], done);
    db.run(`DELETE FROM dogs WHERE name = 'DogWithoutWalks'`, done);
    db.run(`DELETE FROM dogs WHERE name = 'Burek'`, done);
    db.run(`DELETE FROM dogs WHERE name = 'UpdatedBurek'`, done);

    db.run(`delete from adoptions where ba_note='Friendly dog'`, done);
    db.run(`delete from adoptions where ba_note='Test'`, done);

    db.run(`DELETE FROM walk WHERE dog_name = 'Burek'`, done);
    db.run(`DELETE FROM walk WHERE dog_name = 'Reksio'`, done);
    db.run(`DELETE FROM users WHERE mail = 'newuser@example.com'`, done);


    db.run(`DELETE FROM sqlite_sequence WHERE name = 'users'`, done);
    db.run(`DELETE FROM sqlite_sequence WHERE name = 'dogs'`, done);
    db.run(`DELETE FROM sqlite_sequence WHERE name = 'adoptions'`, done);
    db.run(`DELETE FROM sqlite_sequence WHERE name = 'walk'`, done);

    db.close(); 
    done();
  });

  describe('Session Management', () => {
      it('should return user session details if logged in', async () => {
        const loginRes = await request(app)
            .post('/login')
            .send({ name: 'Nath', password: 'Nati' });

        const res = await request(app)
            .get('/checkSession')
            .set('Cookie', loginRes.headers['set-cookie']);

        expect(res.statusCode).toBe(200);
        expect(res.body.loggedIn).toBe(true);
        expect(res.body.name).toBe('Natalia');
        expect(res.body.role).toBe('admin');
    });

    it('should return loggedIn false when no session is present', async () => {
      const res = await request(app).get('/checkSession');
      expect(res.statusCode).toBe(200);
      expect(res.body.loggedIn).toBe(false);
    });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/signUp')
            .send({
                name: 'New',
                surname: 'User',
                email: 'newuser@example.com',
                login: 'NewUserLogin',
                password: 'NewPassword123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id');
    });

    it('should not register a user with duplicate email or login', async () => {
        const res = await request(app)
            .post('/signUp')
            .send({
                name: 'Duplicate',
                surname: 'User',
                email: 'testowy@testowymail.pl', // Istniejący email
                login: 'TestowyUser', // Istniejący login
                password: 'DuplicatePassword123'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/Login już istnieje!|E-mail już istnieje!/);
    });

    it('should return an error for missing fields during sign-up', async () => {
      const res = await request(app)
          .post('/signUp')
          .send({
              name: 'MissingFields',
              surname: '', // Brak pola
              email: 'missingfields@example.com',
              login: '',
              password: 'ValidPassword123'
          });
  
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Wszystkie pola są wymagane!');
  });
  
});

  describe('Authentication', () => {
    it('should not allow login with incorrect credentials', async () => {
      const res = await request(app).post('/login').send({ name: 'invalid', password: 'wrong' });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Użytkownik nie istnieje');
    });

    it('should not allow login if account is not approved', async () => {
      const res = await request(app).post('/login').send({ name: 'TestowyUser', password: 'password123' });
      expect(res.statusCode).toBe(403); // Sprawdzamy kod 403
      expect(res.body.message).toBe('Twoje konto nie zostało jeszcze zatwierdzone przez administratora.');
  });
  
    it('should allow logout and destroy session', async () => {
      const agent = request.agent(app); // Użycie agenta do obsługi sesji
      await agent.post('/login').send({ name: 'Nath', password: 'Nati' });
      const res = await agent.post('/logout');
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('Wylogowano pomyślnie');
    });

    it('should not allow access to protected endpoints without logging in', async () => {
      const res = await request(app).get('/statistics');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Niezalogowany dostęp zabroniony');
  });
  });

  describe('User Management', () => {
    it('should fetch pending users for admin', async () => {
        const loginRes = await request(app)
            .post('/login')
            .send({ name: 'Nath', password: 'Nati' });

        const res = await request(app)
            .get('/pendingUsers')
            .set('Cookie', loginRes.headers['set-cookie']);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should approve a user', async () => {
        const loginRes = await request(app)
            .post('/login')
            .send({ name: 'Nath', password: 'Nati' });

        const res = await request(app)
            .post('/approveUser')
            .set('Cookie', loginRes.headers['set-cookie'])
            .send({ userId: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Użytkownik został zatwierdzony');
    });

    it('should reject a user', async () => {
        const loginRes = await request(app)
            .post('/login')
            .send({ name: 'Nath', password: 'Nati' });

        const res = await request(app)
            .delete('/rejectUser')
            .set('Cookie', loginRes.headers['set-cookie'])
            .send({ userId:3 });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Użytkownik został usunięty');
    });
  });

  describe('Password Reset', () => {
    it('should not allow resetting password with invalid token', async () => {
        const res = await request(app)
            .post('/newPassword')
            .send({ password: 'newPassword123', token: 'invalidToken' });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Nieprawidłowy lub wygasły token');
    });
  });

describe('Adoptions API - Admin Only', () => {
    it('should allow admin to update adoption data', async () => {
        const loginRes = await request(app)
            .post('/login')
            .send({ name: 'Nath', password: 'Nati' });

        const res = await request(app)
            .put('/adoptions/1')
            .set('Cookie', loginRes.headers['set-cookie'])
            .send({
                form_date: '2023-01-05',
                ba_note: 'Updated note',
                walks_amount: 7,
                estimated_adoption_date: '2023-07-01',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Proces adopcyjny zaktualizowany');
    });
  });

  describe('Walks API', () => {
    it('should return walks only for logged-in users', async () => {
        const res = await request(app).get('/walks');
        expect(res.statusCode).toBe(401); // Oczekiwane: niezalogowany użytkownik nie ma dostępu
        expect(res.body.message).toBe('Niezalogowany dostęp zabroniony');
    });

    it('should allow a user to add walks', async () => {
        const loginRes = await request(app)
            .post('/login')
            .send({ name: 'Nath', password: 'Nati' });

        const res = await request(app)
            .post('/walks')
            .set('Cookie', loginRes.headers['set-cookie'])
            .send({
                date: '2025-01-07',
                selectedDogs: ['Burek', 'Reksio']
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Spacery zostały dodane');
    });

    it('should not allow adding walks with invalid data', async () => {
        const loginRes = await request(app)
            .post('/login')
            .send({ name: 'Nath', password: 'Nati' });

        const res = await request(app)
            .post('/walks')
            .set('Cookie', loginRes.headers['set-cookie'])
            .send({ date: null, selectedDogs: 'InvalidData' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Błędne dane wejściowe');
    });
  });

    describe('Statistics API', () => {
      it('should return statistics for all dogs', async () => {
          const loginRes = await request(app)
              .post('/login')
              .send({ name: 'Nath', password: 'Nati' });

          const res = await request(app)
              .get('/statistics')
              .set('Cookie', loginRes.headers['set-cookie']);

          expect(res.statusCode).toBe(200);
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(stat => {
              expect(stat).toHaveProperty('dog_name');
              expect(stat).toHaveProperty('last_walk_date');
              expect(stat).toHaveProperty('days_ago');
          });
      });
      it('should return statistics with no walks for a dog', async () => {
        const loginRes = await request(app)
            .post('/login')
            .send({ name: 'Nath', password: 'Nati' });
    
        // Dodanie psa bez spacerów
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO dogs (name, weight, age, box, arrived, work) VALUES (?, ?, ?, ?, ?, ?)',
                ['DogWithoutWalks', 10, 3, 2, '2025-01-01', 'Test'],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });
    
        const res = await request(app)
            .get('/statistics')
            .set('Cookie', loginRes.headers['set-cookie']);
    
        expect(res.statusCode).toBe(200);
        const dogStats = res.body.find(stat => stat.dog_name === 'DogWithoutWalks');
        expect(dogStats).toBeDefined();
        expect(dogStats.last_walk_date).toBe('brak');
    });
    
  });

  describe('Dogs API', () => {
    
    it('should return all dogs', async () => {
      const res = await request(app).get('/dogs');
      expect(res.statusCode).toBe(401); // Oczekiwane: niezalogowany użytkownik nie ma dostępu
    });

    it('should add a new dog', async () => {
      const loginRes = await request(app)
      .post('/login')
      .send({ name: 'Nath', password: 'Nati' });

      const res = await request(app)
        .post('/dogs') 
        .set('Cookie', loginRes.headers['set-cookie']) 
        .field('name', 'Burek')
        .field('weight', '20')
        .field('box', '20')
        .field('arrived', '2025-01-07')
        .field('age', '2')
        .field('work', 'test')
        .field('image_path','..\frontend\src\assets\Boobie.jpg')
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Pies został dodany');
    });

    it('should update a dog\'s information', async () => {
      const loginRes = await request(app)
          .post('/login')
          .send({ name: 'Nath', password: 'Nati' });

      const res = await request(app)
          .put('/dogs/5')
          .set('Cookie', loginRes.headers['set-cookie'])
          .send({
              name: 'Charlie',
              weight: 25,
              age: 3,
              box: 15,
              arrived: '2025-01-01',
              work: 'new work'
          });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Dane psa zostały zaktualizowane');
  });

    it('should return 404 if dog does not exist for update', async () => {
      const loginRes = await request(app)
          .post('/login')
          .send({ name: 'Nath', password: 'Nati' });

      const res = await request(app)
          .put('/dogs/999') // ID psa, który nie istnieje
          .set('Cookie', loginRes.headers['set-cookie'])
          .send({
              name: 'NonexistentDog',
              weight: 20,
              age: 5,
              box: 10,
              arrived: '2025-01-01',
              work: 'no work'
          });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Nie znaleziono psa');
    });

    it('should return 404 if trying to delete a non-existent dog', async () => {
      const loginRes = await request(app)
          .post('/login')
          .send({ name: 'Nath', password: 'Nati' });

      const res = await request(app)
          .delete('/dogs/999') // ID psa, który nie istnieje
          .set('Cookie', loginRes.headers['set-cookie']);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Nie znaleziono psa');
  });
  });

  describe('Adoptions API', () => {
    it('should return all adoptions for an admin', async () => {
      const loginRes = await request(app)
      .post('/login')
      .send({ name: 'Nath', password: 'Nati' });

      const res = await request(app)
        .get('/adoptions')
        .set('Cookie', loginRes.headers['set-cookie']) 


      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should add a new adoption process', async () => {
      const loginRes = await request(app)
      .post('/login')
      .send({ name: 'Nath', password: 'Nati' });
      const res = await request(app)
        .post('/adoptions')
        .set('Cookie', loginRes.headers['set-cookie']) // Ustaw ciasteczko sesji
        .send({
          dog_name: 'Burek',
          form_date: '2023-01-02',
          ba_note: 'Friendly dog',
          walks_amount: 5,
          estimated_adoption_date: '2023-06-01',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Proces adopcyjny został dodany');
      expect(res.body.adoption_id).toBeDefined();
    });

    it('should return adoption details for a specific dog', async () => {
      const loginRes = await request(app)
          .post('/login')
          .send({ name: 'Nath', password: 'Nati' });

      const res = await request(app)
          .get('/adoptions/5')
          .set('Cookie', loginRes.headers['set-cookie']);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('dog_name');
      expect(res.body).toHaveProperty('form_date');
      expect(res.body).toHaveProperty('ba_note');
    });

    it('should delete an adoption process for a specific dog', async () => {
      const loginRes = await request(app)
          .post('/login')
          .send({ name: 'Nath', password: 'Nati' });
  
      const res = await request(app)
          .delete('/adoptions/1') // Przyjmujemy, że proces adopcyjny z ID 1 istnieje
          .set('Cookie', loginRes.headers['set-cookie']);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Proces adopcyjny został usunięty');
  });

  it('should return 404 if trying to update adoption process for a non-existent dog', async () => {
    const loginRes = await request(app)
        .post('/login')
        .send({ name: 'Nath', password: 'Nati' });

    const res = await request(app)
        .put('/adoptions/999') // ID psa, który nie istnieje
        .set('Cookie', loginRes.headers['set-cookie'])
        .send({
            form_date: '2023-01-05',
            ba_note: 'Updated note',
            walks_amount: 7,
            estimated_adoption_date: '2023-07-01',
        });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Nie znaleziono procesu adopcyjnego');
});
  
  });

  describe('Forgot Password', () => {
    beforeEach(() => {
        mockSendMail.mockClear();
    });

    it('powinien zwracać błąd, jeśli mail nie istnieje', async () => {
        const res = await request(app).post('/forgotPassword').send({ email: 'aaaaa@example.com' });
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Użytkownik nie istnieje');
        expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

});
