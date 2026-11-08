import { ClientEvents } from "discord.js";
import type { AntamClient } from "../core/AntamClient";
import { BaseEventHandler } from "../structure";

export class DiscordEventHandler<T extends keyof ClientEvents> extends BaseEventHandler<
  ClientEvents,
  T
> {
  public register(client: AntamClient): void {
    client.on(this.name, this.listener.bind(client) as any);
  }
}
