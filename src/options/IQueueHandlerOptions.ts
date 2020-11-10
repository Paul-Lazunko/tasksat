import { TTaskParams } from '../constants';
import { IJob } from '../structures';

export interface IQueueHandlerOptions {
  oldQueue?: IJob[],
  store: any
  name: string
  isSilent: boolean
  handler: (...args: TTaskParams) => void
}
