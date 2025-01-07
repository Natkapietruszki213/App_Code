const request = require('supertest');
const app = require('../backend/index'); 
const db = require('../backend/database');
const bcrypt = require('bcrypt');

describe('API Tests', () => {

  beforeAll((done) => {
    db.run(`INSERT INTO users (name, surname, login, password, role, mail, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        ['Test', 'User', 'TestowyUser', bcrypt.hashSync('password123', 10), 'user','testowy@testowymail.pl', 0], 
        done
    );
  });

  afterAll((done) => {
    db.run(`DELETE FROM users WHERE login = ?`, ['TestowyUser'], done);
    db.close(); 
    done();
  });

  describe('Session Management', () => {
    it('should return loggedIn false when no session is present', async () => {
      const res = await request(app).get('/checkSession');
      expect(res.statusCode).toBe(200);
      expect(res.body.loggedIn).toBe(false);
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
  });

  describe('Forgot Password', () => {
    it('should return error if email does not exist', async () => {
      const res = await request(app).post('/forgotPassword').send({ email: 'aaaaa@example.com' });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Użytkownik nie istnieje');
    });

    it('should send reset email for existing user', async () => {
      const res = await request(app).post('/forgotPassword').send({ email: 'testowy@testowymail.pl' });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('E-mail z linkiem resetującym został wysłany');
    });
  });
});
});
