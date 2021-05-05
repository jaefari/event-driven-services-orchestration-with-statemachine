const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
};

if (process.env.SENTRYDSN) {
  // eslint-disable-next-line global-require
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRYDSN, tracesSampleRate: 1.0 });

  logger.error = (error) => {
    console.error(error);
    Sentry.setContext('requestData', error.requestData);
    Sentry.setTag('transaction_id', error.taskId);
    Sentry.setTag('intent', error.intent);
    Sentry.captureException(error);
  };

  logger.info = (info) => {
    console.log(info);
    Sentry.addBreadcrumb({
      ...info,
      level: Sentry.Severity.Info,
    });
  };
}

module.exports = Object.freeze(logger);
