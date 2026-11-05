export type EnumLike<T = any> = {
  [id: string]: T | string;
  [nu: number]: string;
};

export type GetEnum<T> = T extends EnumLike<infer P> ? P : never;

export type MarkRestType<T, B extends boolean> = B extends true ? T[] : T;

export type MarkNullableType<
  T,
  Req extends boolean,
  Rest extends boolean = boolean,
> = Rest extends true ? T : Req extends true ? T : T | null;
export type Arrayable<V> = V | V[];
