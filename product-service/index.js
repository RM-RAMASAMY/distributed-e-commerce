const express = require('express');
const { Pool } = require('pg');
const app = express();

const pool = new Pool({
  user: 'admin',
  host: 'postgres',
  database: 'ecommerce',
  password: 'admin',
  port: 5432,
});

// Create the products table if it doesn't exist
const createTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      price DECIMAL(10, 2)
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('Products table is ready.');
  } catch (err) {
    console.error('Error creating products table:', err);
  }
};

// Call the function to create the table
createTable();

app.use(express.json());

app.post('/products', async (req, res) => {
  const { name, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
      [name, price]
    );
    res.status(201).json(result.rows[0]);
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
