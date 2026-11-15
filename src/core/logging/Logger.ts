export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  tag: string;
  message: string;
  details?: any;
}

export type LogListener = (entry: LogEntry) => void;

export class Logger {
  private static minLevel: LogLevel = LogLevel.DEBUG;
  private static ringBuffer: LogEntry[] = [];
  private static readonly MAX_BUFFER_SIZE = 150;
  private static listeners: Set<LogListener> = new Set();

  public static setLogLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  public static getLogLevel(): LogLevel {
    return this.minLevel;
  }

  public static addListener(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public static debug(tag: string, message: string, details?: any): void {
    this.log(LogLevel.DEBUG, tag, message, details);
  }

  public static info(tag: string, message: string, details?: any): void {
    this.log(LogLevel.INFO, tag, message, details);
  }

  public static warn(tag: string, message: string, details?: any): void {
    this.log(LogLevel.WARN, tag, message, details);
  }

  public static error(tag: string, message: string, details?: any): void {
    this.log(LogLevel.ERROR, tag, message, details);
  }

  public static getHistory(): readonly LogEntry[] {
    return this.ringBuffer;
  }

  public static clearHistory(): void {
    this.ringBuffer = [];
  }

  private static log(level: LogLevel, tag: string, message: string, details?: any): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      tag,
      message,
      details,
    };

    // Maintain ring buffer
    this.ringBuffer.push(entry);
    if (this.ringBuffer.length > this.MAX_BUFFER_SIZE) {
      this.ringBuffer.shift();
    }

    // Format console output
    const timeStr = new Date(entry.timestamp).toISOString().substring(11, 23);
    const prefix = `[${timeStr}] [${tag}]`;

    switch (level) {
      case LogLevel.DEBUG:
        if (details !== undefined) {
          console.debug(`%c${prefix} ${message}`, 'color: #8b949e', details);
        } else {
          console.debug(`%c${prefix} ${message}`, 'color: #8b949e');
        }
        break;
      case LogLevel.INFO:
        if (details !== undefined) {
          console.info(`%c${prefix} ${message}`, 'color: #00e5ff', details);
        } else {
          console.info(`%c${prefix} ${message}`, 'color: #00e5ff');
        }
        break;
      case LogLevel.WARN:
        if (details !== undefined) {
          console.warn(`%c${prefix} ${message}`, 'color: #ff9100; font-weight: bold', details);
        } else {
          console.warn(`%c${prefix} ${message}`, 'color: #ff9100; font-weight: bold');
        }
        break;
      case LogLevel.ERROR:
        if (details !== undefined) {
          console.error(`%c${prefix} ${message}`, 'color: #ff1744; font-weight: bold', details);
        } else {
          console.error(`%c${prefix} ${message}`, 'color: #ff1744; font-weight: bold');
        }
        break;
    }

    // Notify external listeners
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    }
  }
}
