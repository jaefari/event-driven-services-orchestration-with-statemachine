class Publisher {
  constructor(channel, toExchange) {
    this.channel = channel;
    this.toExchange = toExchange;
  }

  publish({ latestEvent, version, requestData, taskId }) {
    const routingKey = 'request';
    return this.channel.publish(this.toExchange, routingKey, Buffer.from(JSON.stringify({ latestEvent, version, requestData, taskId }), 'utf-8'));
  }
}

module.exports = Publisher;
