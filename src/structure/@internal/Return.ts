import { FunctionOutputType } from "./AntamFunction";
import { ArgType } from "./Arg";
import { Context } from "./Context";

export enum ReturnType {
  Error,
  Success,
}

export type ReturnValue<T extends ReturnType> = T extends ReturnType.Error
  ? Error
  : T extends ReturnType.Success
    ? unknown
    : never;

export class Return<
  T extends ReturnType = ReturnType,
  V extends FunctionOutputType = FunctionOutputType,
> {
  constructor(
    public readonly returnType: T,
    public readonly valueType: V,
    public readonly value: ReturnValue<T>,
    public readonly ctx: Context,
  ) {}

  public get error() {
    return this.returnType === ReturnType.Error;
  }
  public get success() {
    return this.returnType === ReturnType.Success;
  }
}
