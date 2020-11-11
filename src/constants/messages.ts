export const messages: { [key: string]: (name: string) => string } = {
  enqueued: (name: string) => `Task ${name} was enqueued`,
  successfullyExecuted: (name: string) => `Task ${name} was successfully executed`,
  unsuccessfullyExecuted: (name: string) => `Task ${name} was not executed with reason:`,
  attemptsCountExceeded: (name: string) => `Task ${name} was not executed, reached maximum attempts count`,
  ttlExceeded: (name: string) => `Task ${name} was not executed, reached ttl value`
};
