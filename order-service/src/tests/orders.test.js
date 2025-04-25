const request = require('supertest');
const app = require('../app');

describe('Order Service', () => {
  let createdOrderId;

  // Test: Create a new order
  it('should create a new order', async () => {
    const response = await request(app)
      .post('/orders')
      .send({ userId: 1, productId: 101, quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body.order).toHaveProperty('id');
    expect(response.body.order.status).toBe('PENDING');

    createdOrderId = response.body.order.id; // Save the order ID for later tests
  });

  // Test: Fetch all orders
  it('should fetch all orders', async () => {
    const response = await request(app).get('/orders');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // Test: Fetch a single order by ID
  it('should fetch a single order by ID', async () => {
    const response = await request(app).get(`/orders/${createdOrderId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', createdOrderId);
  });

  // Test: Update order status
  it('should update the status of an order', async () => {
    const response = await request(app)
      .put(`/orders/${createdOrderId}/status`)
      .send({ status: 'CONFIRMED' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('CONFIRMED');
  });

  // Test: Handle invalid status update
  it('should return an error for invalid status', async () => {
    const response = await request(app)
      .put(`/orders/${createdOrderId}/status`)
      .send({ status: 'INVALID_STATUS' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invalid status/);
  });

  // Test: Handle non-existent order
  it('should return an error for a non-existent order', async () => {
    const response = await request(app).get('/orders/9999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Order not found');
  });
});