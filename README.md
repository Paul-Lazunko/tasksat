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
  logger: console // console is used by default, and you can use any logger
});

// Define task. Note that You can delete task using "deleteTask" method of TaskManager instance

taskManager.addTask(
  // Specify an unique task name
  'foo',
  // specify the main executor (task handler)
  (...params) => {
    return new Promise((resolve, reject) => {
      console.log(`Executed successfully, params: ${JSON.stringify(params, null, 2)}`)
      setTimeout(() => {
        resolve(100);
      }, Math.round(Math.random() * 1000));
    })
  }
);

// Start task manager. Note, that You can to stop it in any time using "stop" method of TaskManager instance

taskManager.start();

// Enqueue the job:

taskManager.enqueueJob(
  {
    taskName: 'foo', // Specify task that should be executed
    params: 1, //  any[], these params will be passed to handler
    options: {
      attempts: 3, // max unsuccessful execution attempts count
      timeoutBetweenAttempts: 1000, // in ms
      ttl: 10000 // max age of the job in ms
    },
    // specify optional successCallback, it will be executed immediately after successful job execution
    successCallback: (...params) => params,
    // specify optional errorCallback, it will be executed when job failed (when all attempts or ttl value are reached)
    errorCallback: (...params) => params,
    // specify via optional parameter how the successCallback will be executed (with task handler execution result for _true_ value and with provided params for _false_ value)
    runSuccessCallbackWithHandlerResult: true
  }
);

// Note that you can use the job enqueue and execution inside the Promise, also you can use custom wrapper to handle execution result:

async function enqueueJob(taskName, params, options) {
    return new Promise((resolve, reject) => {
      taskManager.enqueueJob(
        {
          taskName,
          params,
          options,
          successCallback: resolve,
          errorCallback: reject,
          runSuccessCallbackWithHandlerResult: true
        }
      );
    })
}

```
