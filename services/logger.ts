/**
 * Production-Grade Logger Service for NextGenYield
 *
 * Ensures all debugging logs, network traces, and warnings are safely stripped
 * or silenced in production builds, only executing in development mode (__DEV__).
 */

declare const __DEV__: boolean;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

function formatPrefix(level: LogLevel): string {
  const time = new Date().toISOString().substring(11, 19);
  return `[${time}] [NextGenYield:${level.toUpperCase()}]`;
}

export const logger = {
  log: (...args: any[]): void => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(formatPrefix('log'), ...args);
    }
  },

  info: (...args: any[]): void => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.info(formatPrefix('info'), ...args);
    }
  },

  warn: (...args: any[]): void => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(formatPrefix('warn'), ...args);
    }
  },

  error: (...args: any[]): void => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // In React Native / Expo, console.error triggers a full-screen LogBox RedScreen overlay.
      // We route error messages to console.warn to log clearly in Metro terminal without breaking the mobile UI.
      console.warn(formatPrefix('error'), ...args);
    }
  },

  debug: (...args: any[]): void => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.debug(formatPrefix('debug'), ...args);
    }
  },
};

export default logger;

