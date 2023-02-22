export class Logger {
  public static log (message: string, context: string = 'Log'): void {
    const [logDate, messageContext] = Logger.format(context);

    if (process.env.NODE_ENV !== 'test') {
      const CONSOLE_CLEAR_COLOR_CODE = '\x1b[0m';
      const CONSOLE_FOREGROUND_GREEN_COLOR_CODE = '\x1b[32m';

      console.info(
        '%s%s%s%s%s',
        CONSOLE_FOREGROUND_GREEN_COLOR_CODE,
        logDate, messageContext, message,
        CONSOLE_CLEAR_COLOR_CODE
      );
    }
  }

  public static error (message: string, context: string = 'Log'): void {
    const [logDate, messageContext] = Logger.format(context);

    if (process.env.NODE_ENV !== 'test') {
      const CONSOLE_CLEAR_COLOR_CODE = '\x1b[0m';
      const CONSOLE_FOREGROUND_RED_COLOR_CODE = '\x1b[31m';

      console.error(
        '%s%s%s%s%s',
        CONSOLE_FOREGROUND_RED_COLOR_CODE,
        logDate, messageContext, message,
        CONSOLE_CLEAR_COLOR_CODE
      );
    }
  }

  private static format (context: string): string[] {
    const messageContext = `[${context}]`.padEnd(25);
    const logDate = `[${new Date().toISOString()}]`.padEnd(30);

    return [logDate, messageContext];
  }
}
