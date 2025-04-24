const express = require('express');
const db = require('../db');
const { publishEvent } = require('../services/kafka');
const router = express.Router();

// Create a new order
router.post('/', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    // Insert order into the database
    const result = await db.query(
      'INSERT INTO orders (user_id, product_id, quantity, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, productId, quantity, 'PENDING']
    );

    const order = result.rows[0];

    // Publish OrderCreated event to Kafka
    publishEvent('OrderCreated', {
      orderId: order.id,
      userId: order.user_id,
      productId: order.product_id,
      quantity: order.quantity,
    });

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;