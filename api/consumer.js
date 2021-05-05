const queueName = 'responseQueue';

module.exports = async (channel, emitter) => {
  await channel.prefetch(1);
  await channel.assertQueue(queueName, { durable: true });

  // listen to god exchange when it publishes with response as a routing key
  await channel.bindQueue(queueName, 'godExchange', 'end');

  channel.consume(queueName, async (msg) => {
    const msgBody = JSON.parse(msg.content.toString());
    console.log('received: ', msgBody);
    emitter.emit(msgBody.taskId, msgBody);

    await channel.ack(msg);
  });
};
