import { ILogger } from '../structures';

export interface ITaskManagerOptions {
  storage: string,
  isSilent: boolean,
  logger: ILogger
}
