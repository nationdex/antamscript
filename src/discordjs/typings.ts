import type { Message, User, Guild, BaseChannel, Channel } from "discord.js";

export interface IDiscordContext {
  message: Message;
  args: string[];
  user: User;
  guild: Guild | null;
  channel: Channel | null;
}

export type PartialDiscordContext = Partial<IDiscordContext>;

export type Sendable = {} | Message | User | BaseChannel | Guild;
