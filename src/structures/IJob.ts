import { TTaskParams } from '../constants';
import { IJobOptions } from '../options';

export interface IJob {
  taskName: string,
  options?: IJobOptions
  params: any[],
  successCallback?: (...args: TTaskParams) => void,
  errorCallback?: (...args: TTaskParams) => void,
  runSuccessCallbackWithHandlerResult?: boolean,
}
