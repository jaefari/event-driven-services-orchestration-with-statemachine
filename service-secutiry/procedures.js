module.exports.securityCheck_v1_0_0 = (msg) => {
  msg.securityCheck = true;
  msg.latestEvent = 'doneEvent';
  return msg;
};
