import { TTaskParams } from '../constants';
import { IJob, ILogger } from '../structures';

export interface IQueueHandlerOptions {
  oldQueue?: IJob[],
  store: any
  name: string
  isSilent: boolean
  handler: (...args: TTaskParams) => void,
  logger: ILogger
}
