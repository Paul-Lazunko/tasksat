import {
  messages,
  TTaskParams
} from '../constants';
import { IPseudoIntervalOptions, IQueueHandlerOptions } from '../options';
import { IJob, ILogger } from '../structures';
import { pseudoInterval } from '../helpers';

export class QueueHandler {

  public static isStarted: boolean = false;
  private static instances: Map<string, QueueHandler> = new Map<string, QueueHandler>();

  private readonly name: string;
  private readonly isSilent: boolean;
  private readonly logger: ILogger;
  private readonly handler: (...args: TTaskParams) => any;
  private queue: IJob[];
  private options: IPseudoIntervalOptions;

  constructor(options: IQueueHandlerOptions) {
    this.queue = [];
    this.handler = options.handler;
    this.logger = options.logger || console;
    this.isSilent = options.isSilent;
    this.name = options.name;
    this.options = {
      isActive: false,
      forceExit: false,
      interval: 0,
      handler: this.process.bind(this)
    }
    QueueHandler.instances.set(this.name, this);
    pseudoInterval(this.options);
  }

  public static start() {
    QueueHandler.isStarted = true;
    QueueHandler.instances.forEach((queueHandler: QueueHandler) => queueHandler.start())
  }

  public static stop() {
    QueueHandler.isStarted = false;
    QueueHandler.instances.forEach((queueHandler: QueueHandler) => queueHandler.stop())
  }

  public static deleteInstance(name: string) {
    if ( QueueHandler.instances.has(name) ) {
      QueueHandler.instances.get(name).stop();
      QueueHandler.instances.delete(name);
    }
  }

  public start() {
    this.options.isActive = true;
  }

  public stop() {
    this.options.isActive = false;
    this.options.forceExit = true;
  }

  public enqueue(job: IJob) {
    this.queue.push(job);
    if ( !this.isSilent) {
      this.logger.log(messages.enqueued(this.name));
      this.logger.log(JSON.stringify({ job, enqueued: true }, null, 2))
    }
  }

  public async process(): Promise<void> {
    if ( QueueHandler.isStarted ) {
     const job: IJob = this.queue.shift();
      if ( job ) {
        const { params, options } = job;
        const now = new Date().getTime();
        if (options.timeoutBetweenAttempts) {
         if ( now < (options.lastProcessedAt||0) + options.timeoutBetweenAttempts ) {
           job.options.lastProcessedAt = job.options.lastProcessedAt  || new Date().getTime();
           return this.enqueue(job);
         }
        }
        try {
          job.options.lastProcessedAt = new Date().getTime();
          const result: any = await this.handler(...params);
          if ( !this.isSilent ) {
            this.logger.log(messages.successfullyExecuted(this.name));
            this.logger.log(JSON.stringify({ job, executed: true }, null, 2));
          }
          job.runSuccessCallbackWithHandlerResult ? await this.executeSuccessCallback(job, result) : await this.executeSuccessCallback(job, ...params)
        } catch (e) {
          if ( !this.isSilent ) {
            this.logger.log(messages.unsuccessfullyExecuted(this.name));
            this.logger.error(e);
          }

          this.decrementJobExecutionAttemptsCount(job);
          const hasAttempts: boolean = this.checkJobExecutionAttemptsCount(job);
          if ( hasAttempts ) {
            const isNotExpired: boolean = this.checkJobTtlValue(job);
            if ( isNotExpired ) {
              this.enqueue(job);
            } else  {
              if ( !this.isSilent) {
                this.logger.log(messages.ttlExceeded(this.name));
                this.logger.log(JSON.stringify({ job, executed: false }, null, 2));
              }
              await this.executeErrorCallback(job)
            }
          } else  {
            if ( !this.isSilent) {
              this.logger.log(messages.attemptsCountExceeded(this.name));
              this.logger.log(JSON.stringify({ job, executed: false }, null, 2));
            }
            await this.executeErrorCallback(job)
          }
        }
      }
    }
  }

  private async executeErrorCallback(job: IJob): Promise<void> {
    if ( job.errorCallback ) {
      try {
        await job.errorCallback(...(job.params||[]));
      } catch(e) {
        if ( !this.isSilent ) {
          this.logger.log(messages.unsuccessfullyExecutedErrorCallback(this.name));
          this.logger.log(e.messages);
        }
      }
    }
  }

  private async executeSuccessCallback(job: IJob, ...params: any[]): Promise<void> {
    if ( job.successCallback ) {
      try {
        await job.successCallback(...params);
      } catch(e) {
        if ( !this.isSilent ) {
          this.logger.log(messages.unsuccessfullyExecutedSuccessCallback(this.name));
          this.logger.log(e.messages);
        }
      }
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
    job.options.attempts = attempts > 0 ? attempts - 1 : 0;
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

