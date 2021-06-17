import { TTaskParams } from '../constants';
import { IJob, ILogger } from '../structures';

export interface IQueueHandlerOptions {
  name: string
  isSilent: boolean
  handler: (...args: TTaskParams) => void,
  logger: ILogger
}
