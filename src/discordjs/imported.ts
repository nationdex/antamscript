import type { Channel, Guild, GuildMember, Message, User } from "discord.js";
import type { AntamClient } from "../core";
import type { Context } from "../structure";
import type { Sendable } from "./typings";

type ImportedFunction =
  (typeof ImportedDiscordFunctions)[keyof typeof ImportedDiscordFunctions];

export const ImportedDiscordFunctions = {
  findChannelByID: (client: AntamClient, id: string) => {
    return client.channels.cache.get(id) || null;
  },
  findUserByID: (client: AntamClient, id: string) => {
    return client.users.cache.get(id) || null;
  },
  findGuildByID: (client: AntamClient, id: string) => {
    return client.guilds.cache.get(id) || null;
  },
  findMessageByID: (client: AntamClient, channel: Channel, id: string) => {
    return channel && channel.isTextBased()
      ? channel.messages.cache.get(id) || null
      : null;
  },

  findChannel: (
    client: AntamClient,
    predicate: (channel: Channel) => boolean,
  ) => {
    return client.channels.cache.find(predicate) || null;
  },
  findUser: (client: AntamClient, predicate: (user: User) => boolean) => {
    return client.users.cache.find(predicate) || null;
  },
  findGuild: (client: AntamClient, predicate: (guild: Guild) => boolean) => {
    return client.guilds.cache.find(predicate) || null;
  },

  resolveUser: (
    client: AntamClient,
    value: User | GuildMember | string | null | undefined,
  ): User | null => {
    if (!value) return null;
    if (typeof value === "string") {
      const normalized = value
        .trim()
        .replace(/^<@!?(\d+)>$/, "$1")
        .replace(/^@/, "");
      if (!normalized) return null;
      const byId = client.users.cache.get(normalized);
      if (byId) return byId;
      const lowered = normalized.toLowerCase();
      return (
        client.users.cache.find(
          (user) =>
            user.username.toLowerCase() === lowered ||
            user.globalName?.toLowerCase() === lowered ||
            user.tag.toLowerCase() === lowered,
        ) ?? null
      );
    }
    return "user" in value ? value.user : value;
  },

  snowflake: (
    client: AntamClient,
    snowflake: string,
    parseAs: "channel" | "user" | "guild",
  ) => {
    switch (parseAs) {
      case "channel":
        return client.channels.cache.get(snowflake) || null;
      case "user":
        return client.users.cache.get(snowflake) || null;
      case "guild":
        return client.guilds.cache.get(snowflake) || null;
      default:
        return null;
    }
  },

  sendMessage: async (
    ctx: Context,
    channel: Sendable,
    content: string,
    returnMessage: boolean = true,
  ) => {
    if (!channel) {
      throw new Error("Channel not found");
    }
    return ctx.discordContainer
      .send<Message>(channel, content)
      .then((message) => {
        if (returnMessage) {
          return message ?? null;
        }
        return null;
      });
  },
} as const;

export function getDiscordImportedFunctions(
  ...names: (keyof typeof ImportedDiscordFunctions)[]
) {
  const functions: [string, ImportedFunction][] = [];
  for (const name of names) {
    if (name in ImportedDiscordFunctions) {
      functions.push([name, ImportedDiscordFunctions[name]]);
    }
  }
  return functions;
}
