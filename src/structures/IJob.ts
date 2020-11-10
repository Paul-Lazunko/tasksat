import { TTaskParams } from '../constants';
import { IJobOptions } from '../options';

export interface IJob {
  name?: string,
  options: IJobOptions
  params: any[],
}
