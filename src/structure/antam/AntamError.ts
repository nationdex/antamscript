/*
 * SPDX-License-Identifier: LGPL-3.0-or-later
 * Copyright © 2026 BotForge
 */

import { Parser } from "../../core/Parser";
import type { TranspiledFunction } from "../@internal/TranspiledFunction";

export type GetErrorArgs<T extends string> = T extends `${infer _L}$${infer _R}`
  ? [unknown, ...GetErrorArgs<_R>]
  : [];

export enum ErrorType {
  Custom = "$1",
  InvalidArgType = 'Invalid argument "$1": expected $2, received $3',
  MissingArg = 'Function "$1" is missing argument "$2"',
  MissingFields = 'Function "$1" requires brackets',
  TooFewArgs = 'Function "$1" expects at least $2 argument(s), but got $3',
  TooManyArgs = 'Function "$1" expects at most $2 argument(s), but got $3',
  UnknownFunction = 'Unknown function "$1"',
  UnknownFunctionAtPosition = 'Unknown function at position $1: "$2"',
  RequiresArgumentsAtPosition = 'Function "$1" requires arguments at position $2',
  TranspileError = "$1 at $2:$3 ($4)",
}

export type FunctionReference =
  | TranspiledFunction<any>
  | {
      name?: string;
      display?: string;
      fn?: { name?: string };
      data?: { name: string };
    }
  | string
  | null;

export class AntamError<T extends ErrorType = ErrorType> extends Error {
  public static readonly Regex = /\$(\d+)/g;
  public readonly errorType: T;
  public readonly fnRef: FunctionReference;
  public readonly rawArgs: unknown[];

  public constructor(fn: FunctionReference, type: T, ...args: GetErrorArgs<T>) {
    super(AntamError.make(fn, type, ...args));
    this.name = "AntamError";
    this.errorType = Object.entries(ErrorType).find(
      ([_, _val]) => _val === type,
    )?.[0] as T;
    this.fnRef = fn;
    this.rawArgs = args;
  }

  public static getFunctionDisplay(fn: FunctionReference): string | null {
    if (!fn) return null;
    if (typeof fn === "string") return fn;
    if (
      "display" in fn &&
      typeof fn.display === "string" &&
      fn.display.length > 0
    ) {
      return fn.display;
    }
    if ("name" in fn && typeof fn.name === "string") {
      return `${Parser.GlobalFunctionConfig.functionHead}${fn.name}`;
    }
    if ("fn" in fn && fn.fn && typeof (fn.fn as any).name === "string") {
      return `${Parser.GlobalFunctionConfig.functionHead}${(fn.fn as any).name}`;
    }
    return null;
  }

  public static make(
    fn: FunctionReference,
    type: ErrorType,
    ...args: unknown[]
  ) {
    const res = type.replace(
      this.Regex,
      (match) =>
        `**\`${`${args[Number(match.slice(1)) - 1]}`.replaceAll("\\", "\\\\").replaceAll("`", "\\`")}\`**`,
    );
    const display = this.getFunctionDisplay(fn);
    return `> ${res}${display ? ` at \`${display}\`` : ""}`;
  }
}
