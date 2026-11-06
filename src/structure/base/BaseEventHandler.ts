import { GatewayIntentsString } from "discord.js";
import type { AntamClient } from "../../core/AntamClient";

export type AssertArgs<T> = T extends unknown[] ? T : never;

export interface IEvent<Events, T extends keyof Events> {
  name: T;
  description: string;
  listener: (this: AntamClient, ...args: AssertArgs<Events[T]>) => Promise<void> | void;
  intents?: GatewayIntentsString[];
  deprecated?: boolean;
}

export class BaseEventHandler<
  Events = Record<string, unknown[]>,
  T extends keyof Events = keyof Events,
> {
  public constructor(public readonly data: IEvent<Events, T>) {}

  public get listener() {
    return this.data.listener;
  }

  public get description() {
    return this.data.description;
  }

  public get name() {
    return this.data.name;
  }

  public register(client: AntamClient) {}
}
