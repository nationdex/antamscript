import { randomUUID } from "crypto";
import {
  EnumLike,
  GetEnum,
  MarkNullableType,
  MarkRestType,
} from "../../utils/typings";
import { FunctionOutputType } from "./AntamFunction";
import type { Channel, Guild, Message, User } from "discord.js";

export enum ArgType {
  Unknown,
  String,
  Number,
  Boolean,
  Json,
  Enum,
  User,
  Channel,
  Guild,
  Snowflake,
  Message,
}

export const AllowedArgTypePreset = {
  String: [ArgType.String, ArgType.Enum, ArgType.Boolean, ArgType.Number],
  Any: Object.values(ArgType).filter((x) => typeof x == "number"),
  Boolean: [ArgType.Boolean, ArgType.Number, ArgType.String],
  Snowflake: [
    ArgType.Channel,
    ArgType.Guild,
    ArgType.Message,
    ArgType.Snowflake,
    ArgType.User,
    ArgType.String,
  ],
};

export interface IArg<
  Name extends string = string,
  Type extends ArgType = ArgType,
  Required extends boolean = boolean,
  Rest extends boolean = boolean,
  Enum extends EnumLike = EnumLike,
  Save extends boolean = boolean,
  Raw extends boolean = boolean,
> {
  readonly name: Name;
  description: string;
  type: Type;
  enum?: Enum;

  condition?: boolean;
  /**
   * Preserve the argument's source instead of transpiling it as an expression.
   */
  raw?: Raw;
  /**
   * Defaults to current arg type
   */
  allow?: FunctionOutputType;

  /**
   * Defaults to `false`.
   */
  required?: Required;

  /**
   * Whether this argument is an array of values.
   */
  rest: Rest;

  /** Whether to save it in the variable */
  save: Save;
}

export type GetArgType<
  T extends ArgType,
  Enum extends EnumLike,
  Raw extends boolean = false,
> = Raw extends true
  ? string
  : T extends ArgType.Number
    ? number
    : T extends ArgType.String
      ? string
      : T extends ArgType.Unknown
        ? unknown
        : T extends ArgType.Boolean
          ? boolean
          : T extends ArgType.Enum
            ? GetEnum<Enum>
            : T extends ArgType.Json
              ? Record<string, unknown>
              : T extends ArgType.User
                ? User
                : T extends ArgType.Channel
                  ? Channel
                  : T extends ArgType.Guild
                    ? Guild
                    : T extends ArgType.Snowflake
                      ? string
                      : T extends ArgType.Message
                        ? Message
                        : null;

export type UnwrapArgType<T> =
  T extends IArg<
    any,
    infer Type,
    infer Required,
    infer Rest,
    infer Enum,
    boolean,
    infer Raw
  >
    ? MarkRestType<
        MarkNullableType<GetArgType<Type, Enum, Raw>, Required, Rest>,
        Rest
      >
    : never;

export type UnwrapArgsType<T> = T extends [infer L, ...infer R]
  ? [UnwrapArgType<L>, ...UnwrapArgType<R>]
  : [];

type MarkRestName<T extends string, B extends boolean> = B extends true
  ? `rest$_${T}`
  : `unrest$_${T}`;

type MarkNullableName<T extends string, Req extends boolean> = Req extends true
  ? `$nullnt$${T}`
  : `$nullable$${T}`;
export type UnwrapArgName<T> =
  T extends IArg<infer Name, any, infer Required, infer Rest, any>
    ? `$a${string}$_${MarkRestName<MarkNullableName<Name, Required>, Rest>}`
    : never;

export type UnwrapArgsName<T> = T extends [infer L, ...infer R]
  ? [UnwrapArgName<L>, ...UnwrapArgsName<R>]
  : [];

export type UnwrapArg<T> =
  T extends IArg<any, any, any, any, any, infer Save>
    ? {
        variable: Save extends true ? UnwrapArgName<T> : never;
        code: Save extends false ? string : never;
      }
    : never;
export type UnwrapArgs<T> = T extends [infer L, ...infer R]
  ? [UnwrapArg<L>, ...UnwrapArgs<R>]
  : [];

export function getArgName(arg: IArg) {
  return `$a${randomUUID().replaceAll("-", "_")}$_${arg.rest ? "rest" : "unrest"}$_$${arg.required ? "nullnt" : "nullable"}$${arg.name.replace(/[^a-zA-Z0-9$_]/g, "_")}`;
}
