const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const amqp = require('amqplib');
const uuid = require('uuid').v4;
const events = require('events');
const logger = require('../utils/logger');

const consumer = require('./consumer');
const Publisher = require('./publisher');

const apiExchangeName = process.env.APIEXCHANGENAME;
const port = process.env.PORT || 3000;
const timeout = (process.env.TIMEOUT) ? Number(process.env.TIMEOUT) : 30;
const app = express();
const emitter = new events.EventEmitter();

const main = async () => {
  const connection = await amqp.connect(process.env.AMQP_URL);
  const channel = await connection.createChannel();

  const publisher = new Publisher(channel, apiExchangeName);

  // create exchange that api will use and spread tasks
  await channel.assertExchange(apiExchangeName, 'direct', { durable: true });


  // /timestamp/v1_2_3 /timestamp/v1_2_0 /timestamp/v1_0_0
  app.get('/:latestEvent/:version', async (req, res, next) => {
    try {
      const requestData = { data: 'data' };
      const { latestEvent, version } = req.params;
      const taskId = uuid();

      logger.info({ message: 'get route called' });

      await publisher.publish({ latestEvent, version, requestData, taskId });

      const timerId = setTimeout(() => {
        logger.info({ message: 'setTimeout called' });

        const error = new Error('took too much time to respond');
        error.status = 500;
        error.requestData = requestData;
        error.latestEvent = latestEvent;
        error.taskId = taskId;
        next(error);
      }, timeout * 1000);
      emitter.once(taskId, (data) => {
        clearTimeout(timerId);
        res.json(data);
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message || 'something went wrong', taskId: err.taskId });
    logger.error(err);
  });

  app.listen(port, () => console.log({ message: `api server is running at port ${port}` }));

  // consume responses from finalizerExchange
  await consumer(channel, emitter);
};

(async () => {
  try { await main(); } catch (error) { logger.error(error); }
})();
