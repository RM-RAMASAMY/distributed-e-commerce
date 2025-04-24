const kafka = require('kafka-node');
require('dotenv').config();

const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
const producer = new kafka.Producer(client);

producer.on('ready', () => {
  console.log('Kafka Producer is connected and ready.');
});

producer.on('error', (err) => {
  console.error('Kafka Producer error:', err);
});

const publishEvent = (topic, message) => {
  const payloads = [{ topic, messages: JSON.stringify(message) }];
  producer.send(payloads, (err, data) => {
    if (err) {
      console.error('Error publishing event:', err);
    } else {
      console.log('Event published:', data);
    }
  });
};

module.exports = { publishEvent };