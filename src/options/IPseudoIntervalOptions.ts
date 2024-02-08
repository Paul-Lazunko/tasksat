export interface IPseudoIntervalOptions {
  handler: (...args: any[]) => Promise<any>;
  isActive: boolean;
  forceExit: boolean;
  interval: number
}
