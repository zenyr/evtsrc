export type Chunk<T> = {
  eventName?: string;
  data?: T;
  comment?: string;
};

export type EOS_DEFAULT = { data: string };
