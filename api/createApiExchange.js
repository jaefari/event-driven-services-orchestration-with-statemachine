const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const amqp = require('amqplib');

const apiExchangeName = process.env.APIEXCHANGENAME;

(async () => {
  try {
    const connection = await amqp.connect(process.env.AMQP_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(apiExchangeName, 'direct', { durable: true });

    console.log('apiExchange created');
    process.exit(0);
  } catch (error) {
    console.log(error);
  }
})();
