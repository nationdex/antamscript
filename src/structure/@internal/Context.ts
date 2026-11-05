import { Container } from "../../discordjs/Container";
import { Scope } from "./Scope";

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

  public toJSON() {
    return {
      scope: this.scope.toJSON(),
      content: this.content,
    };
  }
}
