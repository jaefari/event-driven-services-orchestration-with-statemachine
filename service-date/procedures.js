module.exports.addDay_v1_0_0 = (msg) => {
  msg.date = new Date();
  msg.latestEvent = 'doneEvent';
  return msg;
};

module.exports.addTime_v1_0_0 = (msg) => {
  msg.time = new Date().getTime();
  msg.latestEvent = 'doneEvent';
  return msg;
};
