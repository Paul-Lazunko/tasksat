import { EventEmitter } from 'events';
import {
  QUEUE_HANDLER_PROCESS_EVENT_NAME,
  QUEUE_HANDLER_STORE_EVENT_NAME,
  messages,
  TTaskParams
} from '../constants';
import { IQueueHandlerOptions } from '../options';
import { IJob, ILogger } from '../structures';

export class QueueHandler {

  private static isStarted: boolean = false;
  private static instances: Map<string, QueueHandler> = new Map<string, QueueHandler>();

  private readonly name: string;
  private readonly isSilent: boolean;
  private readonly logger: ILogger;
  private readonly handler: (...args: TTaskParams) => void;
  private readonly errorCallback: (...args: TTaskParams) => void;
  private store: any;
  private queue: IJob[];
  private eventEmitter: EventEmitter;

  constructor(options: IQueueHandlerOptions) {
    this.queue = options.oldQueue || [];
    this.handler = options.handler;
    this.logger = options.logger || console;
    this.errorCallback = options.errorCallback;
    this.isSilent = options.isSilent;
    this.store = options.store;
    this.name = options.name;
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.on(QUEUE_HANDLER_PROCESS_EVENT_NAME, this.process.bind(this));
    this.eventEmitter.on(QUEUE_HANDLER_STORE_EVENT_NAME, this.process.bind(this));
    QueueHandler.instances.set(this.name, this);
  }

  public static start() {
    QueueHandler.isStarted = true;
    QueueHandler.instances.forEach((queueHandler: QueueHandler) => queueHandler.start())
  }

  public static stop() {
    QueueHandler.isStarted = false;
  }

  public static deleteInstance(name: string) {
    if ( QueueHandler.instances.has(name) ) {
      QueueHandler.instances.get(name).stop();
      QueueHandler.instances.delete(name);
    }
  }

  public start() {
    this.eventEmitter.emit(QUEUE_HANDLER_PROCESS_EVENT_NAME);
  }

  public stop() {
    this.eventEmitter.removeAllListeners(QUEUE_HANDLER_PROCESS_EVENT_NAME);
    this.eventEmitter.removeAllListeners(QUEUE_HANDLER_STORE_EVENT_NAME);
    this.store.delete(this.name);
  }

  public enqueue(job: IJob) {
    this.queue.push(job);
    if ( !this.isSilent) {
      this.logger.log(messages.enqueued(this.name));
      this.logger.log(JSON.stringify({ job, enqueued: true }, null, 2))
    }
  }

  private _store() {
    this.store.set(this.name, this.queue);
  }

  public async process(): Promise<void> {
    if ( QueueHandler.isStarted ) {
     const job: IJob = this.queue.shift();
      if ( job ) {
        const { params } = job;
        try {
          await this.handler(...params);
          if ( !this.isSilent ) {
            this.logger.log(messages.successfullyExecuted(this.name));
            this.logger.log(JSON.stringify({ job, executed: true }, null, 2));
          }
        } catch (e) {
          if ( !this.isSilent ) {
            this.logger.log(messages.unsuccessfullyExecuted(this.name));
            this.logger.log(e.messages);
          }
          if ( this.errorCallback ) {
            try {
              await this.errorCallback(...params);
            } catch(e) {
              if ( !this.isSilent ) {
                this.logger.log(messages.unsuccessfullyExecutedErrorCallback(this.name));
                this.logger.log(e.messages);
              }
            }
          }
          this.decrementJobExecutionAttemptsCount(job);
          const hasAttempts: boolean = this.checkJobExecutionAttemptsCount(job);
          if ( hasAttempts ) {
            const isNotExpired: boolean = this.checkJobTtlValue(job);
            if ( isNotExpired ) {
              this.enqueue(job);
            } else if ( !this.isSilent) {
              this.logger.log(messages.ttlExceeded(this.name));
              this.logger.log(JSON.stringify({ job, executed: false }, null, 2));
            }
          } else if ( !this.isSilent) {
            this.logger.log(messages.attemptsCountExceeded(this.name));
            this.logger.log(JSON.stringify({ job, executed: false }, null, 2));
          }
        }
      }
     setImmediate(() => {
       this._store();
       this.eventEmitter.emit(QUEUE_HANDLER_PROCESS_EVENT_NAME)
     })
    }
  }

  private checkJobExecutionAttemptsCount(job: IJob): boolean {
    const { options } = job;
    const { attempts } = options;
    return Boolean(attempts);
  }

  private decrementJobExecutionAttemptsCount(job: IJob): void {
    const { options } = job;
    const { attempts } = options;
    job.options.attempts = attempts - 1;
  }

  private checkJobTtlValue(job: IJob): boolean {
    const { options } = job;
    const { enqueuedAt, ttl } = options;
    const timestamp: number = new Date().getTime();
    if ( ttl ) {
      return enqueuedAt + ttl > timestamp;
    }
    return true;
  }


}

