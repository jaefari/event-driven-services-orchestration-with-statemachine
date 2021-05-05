const { createMachine: Machine } = require('xstate');

const systemMachine = Machine({
  id: 'machineId',
  initial: 'start',
  states: {
    start: { on: { backgroundCheck: 'information_informationCheck', timestamp: 'date_addDay' } },
    date_addDay: { on: { doneEvent: 'date_addTime', failEvent: 'end' } },
    date_addTime: { on: { doneEvent: 'end', failEvent: 'end' } },
    information_informationCheck: { on: { doneEvent: 'security_securityCheck', failEvent: 'end' } },
    security_securityCheck: { on: { doneEvent: 'end', failEvent: 'end' } },
    end: { type: 'final' },
  },
});

module.exports = systemMachine;
