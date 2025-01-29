const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
    user: 'admin',          // Matches POSTGRES_USER
    host: 'postgres',       // Use the service name from docker-compose.yaml
    database: 'ecommerce',  // Matches POSTGRES_DB
    password: 'admin',      // Matches POSTGRES_PASSWORD
    port: 5432,             // Default PostgreSQL port
  });
  
  const checkTableQuery = `
SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        );
  `;
  
  (async () => {
    try {
      const result = await pool.query(checkTableQuery);
        const tableExists = result.rows[0].exists;
        console.log(`Users table exists: ${tableExists}`);
    } catch (error) {
        console.error('Error checking users table:', error);
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
