import { Container } from "../../discordjs/Container";
import { Scope } from "./Scope";
import { AntamError, ErrorType, type GetErrorArgs } from "../antam/AntamError";

export interface IContext {
  scope: Scope | "global";
}

export class Context {
  public scope: Scope;

  public content: string = "";
  public readonly startTime = performance.now();
  public discordContainer = new Container(this);

  constructor(data: IContext) {
    this.scope = data.scope == "global" ? Scope.globalScope() : data.scope;
  }

  public error<T extends ErrorType>(type: T, ...args: GetErrorArgs<T>): never {
    throw new AntamError(null, type, ...args);
  }

  public customError(err: Error | string): never {
    if (typeof err === "string") {
      throw new AntamError(null, ErrorType.Custom, err);
    }
    throw err;
  }

  public clone() {
    return new Context({
      scope: this.scope.clone(),
    });
  }

  public toJSON() {
    return {
      scope: this.scope.toJSON(),
      content: this.content,
    };
  }
}
