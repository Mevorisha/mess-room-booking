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
