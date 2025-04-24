// vulnarabilities: 1
// sql-injection Unchecked input in database commands can alter intended queries

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};