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
  isSilent: false, // set to true to view logs
  storage: path.resolve(__dirname, storagePath) // specify storage json file
});

// Define task. Note that You can delete task using delete method of TaskManager instance

taskManager.addTask('foo', (...args) => {
  console.log({ foo: args });
});

// Define another one task

taskManager.addTask('bar', (...args) => {
  throw new Error('Some Error')
});

// Start task manager. Note, that You can to stop it using stop method of TaskManager instance

taskManager.start();

for ( let i =0; i < 5; i++ ) {
  setTimeout(() => {
    // enqueue new job 
    taskManager.enqueueJob(i%2 ? 'bar' : 'foo', {
      params: [i], //  any[], params will be passed to handler 
      options: {
        attempts: 100000, // max unsuccessful execution attempts count
        ttl: 30000 // max age of the job in ms
      }
    });
  }, i * 100)
}

```
