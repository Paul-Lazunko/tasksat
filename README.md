#Tasksat

* doesn't depend on outer services like Redis etc
* uses separated queue for each task (each different job type)
* will continue task execution after restarting the main application (jobs are stored and previously enqueued jobs will be handled after restart)

```ecmascript 6

const path = require('path');
const { TaskManager } = require("tasksat");

const storagePath = `./data/queues.json`;

// Create TaskManager instance (it is Singleton)

const taskManager = TaskManager.getInstance({
  isSilent: true, // set to true to display logs
  storage: path.resolve(__dirname, storagePath), // specify path to the storage (*.json file)
  logger: console // console is used by default, and you can use any logger
});

// Define task. Note that You can delete task using "deleteTask" method of TaskManager instance

taskManager.addTask('foo',
  // specify executor
  (...params) => {
    return new Promise((resolve, reject) => {
      console.log(`Executed successfully, params: ${JSON.stringify(params, null, 2)}`)
      setTimeout(resolve, Math.round(Math.random() * 1000));
    })
  },
  // specify errorHandler, it will be will be executed when job failed
  (...params) => {
    return new Promise((resolve, reject) => {
      console.log(`errorHandler was called with next params: ${JSON.stringify(params, null, 2)}`)
      setTimeout(resolve, Math.round(Math.random() * 1000));
    })
  },
);

// Define another one task

taskManager.addTask('bar',
  (...params) => {
    // specify executor
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(`Was not executed, params: ${JSON.stringify(params, null, 2)}`)
        reject(new Error('Bar doesn\'t work properly'));
      }, Math.round(Math.random() * 1000));
    })
  },
  // specify errorHandler, it will be will be executed when job failed
  (...params) => {
    return new Promise((resolve, reject) => {
      console.log(`errorHandler was called with next params: ${JSON.stringify(params, null, 2)}`)
      setTimeout(resolve, Math.round(Math.random() * 1000));
    })
  }
);

// Start task manager. Note, that You can to stop it in any time using "stop" method of TaskManager instance

taskManager.start();

for ( let i =0; i < 5; i++ ) {
  taskManager.enqueueJob(
    i%2 ? 'bar' : 'foo',
{
    params: [i], //  any[], params will be passed to handler
    options: {
      attempts: 3, // max unsuccessful execution attempts count
      ttl: 10000 // max age of the job in ms
    }
  });
}

```
