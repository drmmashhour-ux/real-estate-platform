export type IcsEventShape = {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  status?: string;
  raw?: unknown;
};
