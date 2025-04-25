const express = require('express');
const db = require('../db');
const { publishEvent } = require('../services/kafka');
const router = express.Router();

// Create a new order
router.post('/', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  // Input validation
  if (!userId || !productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid input. Ensure userId, productId, and quantity are provided and valid.' });
  }

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

// Fetch all orders
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Fetch a single order by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];

router.put('/:id/status', async (req, res) => {
  const { status } = req.body;

  // Validate the status
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}` });
  }

  try {
    // Update the order status in the database
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;