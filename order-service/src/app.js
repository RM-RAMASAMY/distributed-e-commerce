const express = require('express');
const bodyParser = require('body-parser');
const orderRoutes = require('./routes/orders');

const app = express();

app.use(bodyParser.json());
app.use('/orders', orderRoutes);

module.exports = app;