import { createRequire } from "node:module";
import { AntamClient } from "../core/AntamClient";
import readdir from "../utils/readdir";
import nativeEvents from "../events/list";

const require = createRequire(import.meta.url);

type RegisteredEventHandler = {
  name: string;
  data: { name: string; description: string };
  register(client: AntamClient): void;
};

export const NativeEventName = "AntamScriptNative";

export class EventsManager {
  public static readonly Loaded: Partial<Record<string, Record<string, RegisteredEventHandler>>> =
    {};

  private events = new Map<string, Map<string, RegisteredEventHandler>>();

  public constructor(private readonly client: AntamClient) {}

  public static loadNative() {
    this.Loaded[NativeEventName] = Object.fromEntries(
      nativeEvents.map((event) => [event.name, event]),
    );
  }

  public load(name: string, ...events: (string | string[])[]): void {
    for (const eventType of events.flat()) {
      EventsManager.Loaded[name] ??= {};
      const event = EventsManager.Loaded[name]![eventType];
      if (!event) throw new Error(`Event ${name} => ${eventType} is not supported.`);
      if (this.events.get(name)?.has(eventType)) continue;
      this.events.get(name)?.set(eventType, event);
      if (!this.events.has(name)) this.events.set(name, new Map([[eventType, event]]));
      event.register(this.client);
    }
  }

  public static load(name: string, path: string) {
    this.Loaded[name] = {};
    for (const file of readdir(path).filter((x) => x.endsWith(".js") || x.endsWith(".ts"))) {
      const req = require(file).default as RegisteredEventHandler;
      this.Loaded[name]![req.name] = req;
    }
  }

  public static toJSON(name: string) {
    return Object.values(this.Loaded[name]!).map((x) => ({ ...x!.data }));
  }

  public has(handler: string, type: any) {
    return this.events.get(handler)?.has(type) ?? false;
  }
}
