export interface IScopeConstructor {
  name: string;
}

export interface ScopeJSON {
  name: string;
  functions: Record<string, string>;
  variables: Record<string, { value: unknown; constant: boolean }>;
}

export class Scope {
  public name: string;

  public functions = new Map<string, string>();
  public variables = new Map<string, { value: unknown; constant: boolean }>();

  constructor(data: IScopeConstructor) {
    this.name = data.name;
  }

  addFunction(name: string, f: string, overwrite = false) {
    if (!overwrite && this.functions.has(name)) return;
    this.functions.set(name, f);
  }

  scopeFunctions(): string {
    return Array.from(this.functions.entries())
      .map(([name, f]) => `const f$${name} = ${f};`)
      .join("\n");
  }

  public setVariable(name: string, value: unknown, constant = false) {
    const current = this.variables.get(name);
    if (current?.constant)
      throw new TypeError(`Cannot reassign constant "${name}"`);
    this.variables.set(name, { value, constant });
  }

  public getVariable(name: string) {
    const variable = this.variables.get(name);
    if (!variable)
      throw new ReferenceError(`Variable "${name}" is not defined`);
    return variable.value;
  }

  public hasVariable(name: string) {
    return this.variables.has(name);
  }

  public deleteVariable(name: string) {
    return this.variables.delete(name);
  }

  clone() {
    let scope = new Scope({
      name: this.name,
    });
    this.functions.forEach((f, name) => {
      scope.addFunction(name, f);
    });
    this.variables.forEach((v, name) => {
      scope.setVariable(name, v.value, v.constant);
    });
    return scope;
  }

  toJSON(): ScopeJSON {
    return {
      name: this.name,
      functions: Object.fromEntries(this.functions.entries()),

      variables: Object.fromEntries(this.variables.entries()),
    };
  }

  static globalScope() {
    return new Scope({
      name: "global",
    });
  }
}
