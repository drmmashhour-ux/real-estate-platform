export type SourcePathEntry = {
  path: string;
  description?: string;
};

export type SourcePathRegistry = Record<string, SourcePathEntry[]>;
