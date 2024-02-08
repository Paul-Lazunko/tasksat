import { IPseudoIntervalOptions } from '../options/IPseudoIntervalOptions';

export function pseudoInterval(options: IPseudoIntervalOptions) {
  const { handler, isActive, forceExit, interval } = options;
  setTimeout(async () => {
    if ( isActive ) {
      await handler();
    }
    if (!forceExit) {
      pseudoInterval(options)
    }
  }, interval);
}

