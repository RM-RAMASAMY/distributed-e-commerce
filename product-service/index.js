const express = require('express');
const { Pool } = require('pg');
const app = express();
app.use(express.json());

const pool = new Pool({
  user: 'admin',
  host: 'postgres',
  database: 'ecommerce',
  password: 'admin',
  port: 5432,
});

// Check if the products table exist

const checkTableQuery = `
SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'products'
        );
  `;
  
  (async () => {
    try {
      const result = await pool.query(checkTableQuery);
        const tableExists = result.rows[0].exists;
        console.log(`products table exists: ${tableExists}`);
    } catch (error) {
        console.error('Error checking users table:', error);
    }
  })();

app.post('/products', async (req, res) => {
  const { name, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
      [name, price]
    );
    res.status(201).send('Product added');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(3002, () => console.log('Product service running on port 3002'));
