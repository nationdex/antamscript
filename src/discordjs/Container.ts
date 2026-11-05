import {
  BaseChannel,
  Channel,
  EmbedBuilder,
  Message,
  MessageFlags,
  MessageReplyOptions,
  TextChannel,
  User,
} from "discord.js";
import { Context } from "../structure";
import { Sendable } from "./typings";

export class Container {
  // message data
  public embeds = new Array<EmbedBuilder>();
  public channel?: Channel;
  // flags
  public edit = false;
  public silent = false;

  public deleteIn?: number;

  constructor(public ctx: Context) {}

  public async send<T = unknown>(
    obj: Sendable,
    content?: string,
  ): Promise<T | null> {
    let res: Promise<unknown>;
    const options = this.getOptions<any>(content);

    if (!this.isValidMessage(options)) {
      return null;
    }

    if (this.channel && this.channel.isTextBased()) {
      res = (this.channel as TextChannel).send(options);
    } else if (obj instanceof Message) {
      res = this.edit
        ? obj.edit(options)
        : (obj.channel as TextChannel).send(options);
    } else if (obj instanceof BaseChannel && obj.isTextBased()) {
      res = (obj as TextChannel).send(options);
    } else if (obj instanceof User) {
      res = obj.send(options);
    } else {
      res = Promise.resolve(null);
    }

    const result = (await res.catch(() => {})) as T;

    if (this.deleteIn && result instanceof Message) {
      setTimeout(() => {
        result.delete().catch(() => {});
      }, this.deleteIn);
    }

    this.reset();
    return result;
  }

  public isValidMessage(options: MessageReplyOptions) {
    return !!options.content?.trim() || !!options.embeds?.length;
  }

  public embed(index: number) {
    return (this.embeds[index] ??= new EmbedBuilder());
  }

  public reset() {
    delete this.channel;
    delete this.deleteIn;

    this.content = "";
    this.edit = false;
    this.silent = false;

    this.embeds.length = 0;
  }

  public getOptions<T>(content?: string): T {
    const flags = new Array<MessageFlags>();
    if (this.silent) flags.push(MessageFlags.SuppressNotifications);

    return (
      content
        ? {
            content,
          }
        : {
            flags: flags.length === 0 ? undefined : flags,
            content: this.content?.trim() || null,
            embeds: this.embeds,
          }
    ) as T;
  }

  get content() {
    return this.ctx.content;
  }
  set content(value: string) {
    this.ctx.content = value;
  }
}
