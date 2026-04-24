export type SimpleTextDiff = {
  before: string;
  after: string;
  changed: boolean;
};

export function simpleTextDiff(before: string, after: string): SimpleTextDiff {
  return {
    before,
    after,
    changed: before !== after,
  };
}
