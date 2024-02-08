export interface IJobOptions {
  ttl?: number;
  attempts?: number;
  timeoutBetweenAttempts?: number;
  enqueuedAt?: number;
  lastProcessedAt?: number;
}
