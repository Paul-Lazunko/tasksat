export interface ILogger {
  log: (...args: any[]) => void,
  info?: (...args: any[]) => void,
  warning?: (...args: any[]) => void,
  error?: (...args: any[]) => void,
  debug?: (...args: any[]) => void,
}
