const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const amqp = require('amqplib');
const assert = require('assert');
const logger = require('../utils/logger');

const serviceName = process.env.SERVICENAME;
const cosumesFromExchange = process.env.CONSUMESFROMEXCHANGE;
const publishesToQueue = process.env.PUBLISHESTOQUEUE;
const procedures = require('./procedures');

const queueName = `${serviceName}Queue`;

// parse the procedures defined by the user
let supportedProcedures;
try {
  supportedProcedures = Object.keys(procedures).map((e) => {
    const procedureLegalNameRegex = /.*_v[0-9]+_[0-9]+_[0-9]+$/;

    assert(procedureLegalNameRegex.test(e));
    return { procedure: e.split('_v')[0], version: e.split('_v')[1] };
  });
} catch (error) {
  throw new Error('can not parse supported procedures and their versions, please follow the naming rule: procedureName_v2_1_10 or... ');
}

logger.info(serviceName);
logger.info(supportedProcedures);

const main = async () => {
  const connection = await amqp.connect(process.env.AMQP_URL);
  const channel = await connection.createChannel();

  // create queue that this service will receive it's works
  await channel.assertQueue(queueName, { durable: true });

  // inform godExhange that I support this procedures/versions
  await Promise.all(supportedProcedures.map((supportedProcedure) => channel.bindQueue(queueName, cosumesFromExchange, `${serviceName}_${supportedProcedure.procedure} v${supportedProcedure.version}`)));

  // consume from it's queue
  // all procedures use the same queue, each procedure can have it's own queue if necessary
  channel.consume(queueName, async (msg) => {
    const msgBody = JSON.parse(msg.content.toString());
    const { latestEvent, version, requestData, taskId } = msgBody;
    try {
      logger.info(msgBody);

      const requestedProcedure = msgBody.state.split('_')[1];

      procedures[`${requestedProcedure}_${version}`](msgBody);

      // send back to godQueue
      await channel.sendToQueue(publishesToQueue, Buffer.from(JSON.stringify(msgBody), 'utf-8'));

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
