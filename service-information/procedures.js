module.exports.informationCheck_v1_0_0 = (msg) => {
  msg.informationCheck = true;
  msg.latestEvent = 'doneEvent';
  return msg;
};
