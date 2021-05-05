# Event driven architecture, Orchestration, Rabbitmq and State machine version

## Cautious
it's just an afternoon playground :)

## Description
in the previous implementation [the previous implementation](https://github.com/jaefari/choreography-services-rabbitmq) each service only listens to an event and responds that it has done its work, and if any other services are interested to continue the job, they will get the job and do the next part of the job. however, there is no centralized implementation of the business logic, this situation might be too much flexible and get out of control.

Instead, what about using a state machine, which is remarkably descriptive, to declare business steps and control everything. then what about completely decoupling business logic and implementation? well, it seems interesting. In this scenario, each service should be awfully dumb and only do a specific procedure very well, and only do that responsibility. 

Using a state machine gives this ability to define business logic and a high-level view of the software system in a blink without implementing a line of code!


Here is the demonstration of implementing the state machine of the business logic in a unit that is called God! because it knows everything about the business steps and workers' (service discovery)
![choreography services communication ](https://raw.githubusercontent.com/jaefari/event-driven-services-orchestration-with-statemachine/main/img/system.jpeg)

1. first API service creates a message
1. then based on the requested event from the user, god knows what's the next step, also it knows which services provide which version of the procedures. In other words, **services are completely BLIND about each other's existences or what is the business logic**, they only perform actions on input and send back the data to the god. 
1. worker receives the job from the god
1. worker sends back the result to the god, and god knows the state has changed and orders the next step from its workers.
1. this process repeats until the state of the task is the end.
1. finally API service will get notified about the result by its observer and will respond.
this way, each service only performs a simple and small task, hence, it'll be remarkably independent in its implementation or tests.

## Installation
first config .env of each service and set rabbitmq url and sentry url, then:
```bash
npm i
```
Because of the loop usage of exchanges depicted in above picture, the apiExchange must be created manually via script
```bash
node api/createApiExchange.js
```

## Usage
```
// first run services

node service-date
node service-information
node service-security

// now run the god
node god

// now run api
node api
```

## Creating a new Service
just copy one of the services folders like service-date and only take care of procedures.js and define your procedures, **this file will be parsed to create anything that is needed, services will creates required queues and exchanges amd notify godExchange about its services and their version**

```javascript
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
```


## Sample procedures
```bash
GET http://localhost:3000/timestamp/v1_0_0
GET http://localhost:3000/backgroundCheck/v1_0_0
```