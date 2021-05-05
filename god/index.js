const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const amqp = require('amqplib');
const logger = require('../utils/logger');

const systemMachine = require('./states');

const serviceName = 'god';
const cosumesFromExchange = 'apiExchange';

const queueName = `${serviceName}Queue`;
const exchangeName = `${serviceName}Exchange`;

const main = async () => {
  const connection = await amqp.connect(process.env.AMQP_URL);
  const channel = await connection.createChannel();

  // create queue that this service will receive it's works
  await channel.assertQueue(queueName, { durable: true });

  // await Promise.all(supportedIntents.map((supportedIntent) => channel.bindQueue(queueName, cosumesFromExchange, `${serviceName}-${supportedIntent.intent}-v${supportedIntent.intentVersion}`)));
  // TODO: it should read from all exchanges, and it knows about all exhanges by poling by a brodcast message
  await channel.bindQueue(queueName, cosumesFromExchange, 'request');

  // create exchnage that this worker will publish it's done works
  await channel.assertExchange(exchangeName, 'direct', { durable: true });

  // consume from it's queue
  channel.consume(queueName, async (msg) => {
    const msgBody = JSON.parse(msg.content.toString());
    if (!msgBody.state) msgBody.state = 'start';
    if (!msgBody.statesHistory) msgBody.statesHistory = ['start'];
    if (!msgBody.eventsHistory) msgBody.eventsHistory = [];
    const { latestEvent, version, requestData, taskId } = msgBody;
    try {
      logger.info('before');
      logger.info(msgBody);

      msgBody.state = systemMachine.transition(msgBody.state, latestEvent).value; // set next state
      msgBody.statesHistory.push(msgBody.state); // just keep track of states history
      msgBody.eventsHistory.push(msgBody.latestEvent); // just keep track of states history

      // send possible events on this state for the service, for better vison of the developer
      msgBody.possibleEvents = systemMachine.states[msgBody.state].events;

      logger.info('after');
      logger.info(msgBody);

      const routingKey = (msgBody.state === 'end') ? 'end' : `${msgBody.state} ${version}`;
      await channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(msgBody), 'utf-8'));


      await channel.ack(msg);

    } catch (error) {
      error.requestData = requestData;
      error.latestEvent = latestEvent;
      error.taskId = taskId;
      logger.error(error);
    }
  });
};

(async () => {
  try { await main(); } catch (error) { logger.error(error); }
})();
