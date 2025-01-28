const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());

// const pool = new Pool({
//   user: 'admin',
//   host: 'localhost',
//   database: 'ecommerce',
//   password: 'admin',
//   port: 5432,
// });

const pool = new Pool({
    user: 'admin',          // Matches POSTGRES_USER
    host: 'postgres',       // Use the service name from docker-compose.yaml
    database: 'ecommerce',  // Matches POSTGRES_DB
    password: 'admin',      // Matches POSTGRES_PASSWORD
    port: 5432,             // Default PostgreSQL port
  });
  
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100)
  );
  `;
  
  (async () => {
    try {
      await pool.query(createTableQuery);
      console.log('Users table ensured.');
    } catch (error) {
      console.error('Error creating users table:', error);
    }
  })();
  

app.get('/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  await pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email]);
  res.status(201).send('User created');
});

app.listen(3001, () => console.log('User service running on port 3001'));
