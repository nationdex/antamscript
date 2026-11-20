export interface IScopeConstructor {
  name: string;
}

export interface ScopeJSON {
  name: string;
  functions: Record<string, string>;
  variables: {
    var: Record<string, number>;
    let: Record<string, number>;
  };
}

export class Scope {
  public name: string;

  public functions = new Map<string, string>();
  public variableIDs = {
    var: {} as Record<string, number>,
    let: {} as Record<string, number>,
  };
  #variableCounter = 0;
  #environment: Record<string, unknown> = {};

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

  registerVariable(name: string, type: "var" | "let" = "var") {
    let id = this.getVariableID(name);
    if (id === undefined) {
      id = this.#variableCounter++;
      this.variableIDs[type][name] = id;
    }
    return id;
  }

  getVariableID(name: string, type?: "var" | "let"): number | undefined {
    if (type) return name in this.variableIDs[type] ? this.variableIDs[type][name] : undefined;
    // try finding in both (var > let)
    return this.getVariableID(name, "var") ?? this.getVariableID(name, "let");
  }

  getVariableType(name: string): "var" | "let" | undefined {
    if (name in this.variableIDs.var) return "var";
    if (name in this.variableIDs.let) return "let";
    return undefined;
  }

  deleteVariable(varName: string, type?: "var" | "let") {
    if (type) {
      delete this.variableIDs[type][varName];
    } else {
      this.deleteVariable(varName, "var");
      this.deleteVariable(varName, "let");
    }
  }

  public setEnvironment(key: string | string[], value: unknown) {
    if (Array.isArray(key)) {
      Scope.transverseSet(this.#environment, value, ...key);
    } else {
      this.#environment[key] = value;
    }
  }

  public getEnvironment(...keys: string[]) {
    return Scope.transverseGet(this.#environment, ...keys);
  }

  public deleteEnvironment(key: string) {
    delete this.#environment[key];
  }

  clone(cloneEnv = false) {
    let scope = new Scope({
      name: this.name,
    });
    this.functions.forEach((f, name) => {
      scope.addFunction(name, f);
    });
    if (cloneEnv)
      for (const [key, value] of Object.entries(this.#environment)) {
        scope.setEnvironment(key, value);
      }
    scope.variableIDs = {
      var: { ...this.variableIDs.var },
      let: { ...this.variableIDs.let },
    };
    scope.#variableCounter = this.#variableCounter;
    return scope;
  }

  toJSON(): ScopeJSON {
    return {
      name: this.name,
      functions: Object.fromEntries(this.functions.entries()),
      variables: {
        var: { ...this.variableIDs.var },
        let: { ...this.variableIDs.let },
      },
    };
  }

  static globalScope() {
    return new Scope({
      name: "global",
    });
  }

  static transverseGet<T = any>(obj: object, ...args: string[]): T | undefined {
    if (!obj) return obj;

    for (const key of args) {
      if (!(key in obj)) return undefined;
      obj = obj[key as keyof typeof obj];
      if (typeof obj !== "object" || obj === null) break;
    }

    return obj as T;
  }

  static transverseSet(obj: object, value: any, ...args: string[]) {
    if (!obj) return obj;

    let lastKey = args.pop();
    if (!lastKey) return obj;

    for (const key of args) {
      if (!(key in obj)) return obj;
      obj = obj[key as keyof typeof obj];
      if (typeof obj !== "object" || obj === null) return obj;
    }

    // @ts-ignore
    return (obj[lastKey as keyof typeof obj] = value);
  }
}
