export enum LogType {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface DateTimeRange {
  from: Date;
  to: Date;
}

export type LogsModel = Record<
  string,
  {
    message: string;
    type: string;
  }
>;
