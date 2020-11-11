#Tasksat

* doesn't depend on outer services like Redis
* uses separated queue for each task
* continue task execution after restarting the application

```ecmascript 6

const path = require('path');
const { TaskManager } = require("tasksat");

const storagePath = `./data/queues.json`;

// get TaskManager Instance:

const taskManager = TaskManager.getInstance({
  isSilent: true, // set to true to view logs
  storage: path.resolve(__dirname, storagePath) // specify storage json file
});

// Define task. Note that You can delete task using delete method of TaskManager instance

taskManager.addTask('foo', (...params) => {
  return new Promise((resolve, reject) => {
    console.log(`Executed successfully, params: ${JSON.stringify(params, null, 2)}`)
    setTimeout(resolve, Math.round(Math.random() * 1000));
  })
});

// Define another one task

taskManager.addTask('bar', (...params) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`Was not executed, params: ${JSON.stringify(params, null, 2)}`)
      reject(new Error('Bar doesn\'t work properly'));
    }, Math.round(Math.random() * 1000));
  })});

// Start task manager. Note, that You can to stop it using stop method of TaskManager instance

taskManager.start();

for ( let i =0; i < 5; i++ ) {
  taskManager.enqueueJob(i%2 ? 'bar' : 'foo', {
    params: [i], //  any[], params will be passed to handler
    options: {
      attempts: 3, // max unsuccessful execution attempts count
      ttl: 10000 // max age of the job in ms
    }
  });
}

```
