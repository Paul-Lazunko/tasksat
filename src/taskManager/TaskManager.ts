import { ITaskManagerOptions } from '../options';
import { QueueHandler } from '../queueHandler';
import { IJob, ILogger } from '../structures';
const StoreConstructor = require('data-store');


export class TaskManager {

  private static instance: TaskManager;

  private store: any;
  private isSilent: boolean;
  private logger: ILogger;
  private queueHandlers: Map<string, QueueHandler>;
  private errorCallbacks: Map<string, (...args: any[]) => void>

  private constructor(options: ITaskManagerOptions) {
    const {
      storage,
      isSilent,
      logger
    } = options;
    this.logger = logger;
    this.isSilent = isSilent;
    this.store = StoreConstructor({ path: storage });
    this.queueHandlers = new Map<string, QueueHandler>();
  }

  public static getInstance(options: ITaskManagerOptions): TaskManager {
    if ( !TaskManager.instance ) {
      TaskManager.instance = new TaskManager(options);
    }
    return TaskManager.instance;
  }

  public addTask(name: string, handler: (...args: any[]) => void, errorCallback: (...args: any[]) => void) {
    if ( typeof name !== 'string' ) {
      throw new Error(`The name parameter should be a string`)
    }
    if ( typeof handler !== 'function' ) {
      throw new Error(`The handler parameter should be a function`)
    }
    if ( errorCallback && typeof errorCallback !== 'function' ) {
      throw new Error(`The handler parameter should be a function`)
    }
    if ( this.queueHandlers.has(name) ) {
      throw new Error(`Task ${name} exists already`)
    }
    this.queueHandlers.set(name, new QueueHandler({
      name,
      handler,
      errorCallback: errorCallback ? errorCallback : () => {},
      oldQueue: this.store.get(name) || [],
      store: this.store,
      isSilent: this.isSilent,
      logger: this.logger
    }));
  }

  public deleteTask(name: string, clearStorage?: boolean): void {
    if ( !this.queueHandlers.has(name) ) {
      throw new Error(`Task ${name} doesn't exist`)
    }
    this.queueHandlers.delete(name);
    QueueHandler.deleteInstance(name);
   if ( clearStorage ) {
     this.store.delete(name);
   }
  }

  public enqueueJob(name: string, job: IJob) {
    if ( job.options ) {
      if ( typeof job.options !== 'object' ) {
        throw new Error(`Options should be an object`);
      }
      const { ttl, attempts } = job.options;
      if ( !ttl || typeof ttl !== 'number' || ttl < 0 ) {
        throw new Error(`ttl should be positive integer`)
      }
      if ( !attempts || typeof attempts !== 'number' || ttl < 0 ) {
        throw new Error(`attempts should be positive integer`)
      }
    } else {
      job.options = {};
    }
    job.name = name;
    job.options.enqueuedAt = new Date().getTime();

    this.queueHandlers.get(name).enqueue(job);

  }

  public start() {
    QueueHandler.start();
  }

  public stop() {
    QueueHandler.stop();
  }

}
