require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const redis = require("redis");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3002;

// PostgreSQL Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Redis Connection
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
redisClient.connect().catch(console.error);

app.use(bodyParser.json());

// Create Product
app.post("/products", async (req, res) => {
  const { name, price, stock } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *",
      [name, price, stock]
    );
    await redisClient.del("products"); // Clear Cache
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get All Products (with Redis Caching)
app.get("/products", async (req, res) => {
  try {
    const cachedProducts = await redisClient.get("products");
    if (cachedProducts) {
      return res.json(JSON.parse(cachedProducts));
    }

    const result = await pool.query("SELECT * FROM products");
    await redisClient.setEx("products", 3600, JSON.stringify(result.rows));
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get Product by ID
app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const cachedProduct = await redisClient.get(`product:${id}`);
    if (cachedProduct) {
      return res.json(JSON.parse(cachedProduct));
    }

    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });

    await redisClient.setEx(`product:${id}`, 3600, JSON.stringify(result.rows[0]));
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update Product Stock
app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  try {
    const result = await pool.query(
      "UPDATE products SET stock = $1 WHERE id = $2 RETURNING *",
      [stock, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });

    await redisClient.del("products");
    await redisClient.del(`product:${id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Delete Product
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    await redisClient.del("products");
    await redisClient.del(`product:${id}`);
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(port, () => {
  console.log(`Product service running on port ${port}`);
});
