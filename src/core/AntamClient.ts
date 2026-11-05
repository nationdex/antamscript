import {
  Client,
  ClientEvents,
  ClientOptions,
  DefaultWebSocketManagerOptions,
  IntentsBitField,
  Partials,
} from "discord.js";
import { createRequire } from "node:module";
import type { Message } from "discord.js";
import {
  EventsManager,
  FunctionManager,
  NativeCommandManager,
  NativeEventName,
} from "../managers";
import { Context, Scope } from "../structure";
import { TranspiledResult, Transpiler } from "./Transpiler";

const require = createRequire(import.meta.url);

export interface IRawAntamClientOptions extends ClientOptions {
  commands?: string;
  prefixes?: string[];
  prefixCaseInsensitive?: boolean;
  events?: (keyof ClientEvents)[];
  mobile?: boolean;
  allowBots?: boolean;
  token?: string;
}

export interface IAntamClientOptions extends Omit<
  IRawAntamClientOptions,
  "prefixes"
> {
  prefixes: TranspiledResult[];
}

export class AntamClient extends Client<true> {
  declare public options: (Omit<ClientOptions, "intents"> & {
    intents: IntentsBitField;
  }) &
    IAntamClientOptions;

  public readonly events = new EventsManager(this);
  public readonly commands = new NativeCommandManager(this);
  readonly #initialization: Promise<void>;

  [x: PropertyKey]: unknown;

  public constructor(options: IRawAntamClientOptions) {
    super({
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User,
      ],
      ...options,
    });

    this.#initialization = this.#init(options);
  }

  async #init(raw: IRawAntamClientOptions) {
    if (this.options.mobile) {
      Reflect.set(
        DefaultWebSocketManagerOptions.identifyProperties,
        "browser",
        "Discord iOS",
      );
    }

    FunctionManager.loadNative();
    EventsManager.loadNative();

    if (this.options.commands) {
      await this.commands.load(this.options.commands);
    }

    if (this.options.events?.length) {
      this.events.load(NativeEventName, this.options.events);
    }

    this.options.prefixes = [];
    for (const prefix of raw.prefixes ?? []) {
      this.options.prefixes.push(
        await Transpiler.transpile(prefix, {
          client: this,
          terminator: "$ctx.content",
          ignoreText: false,
          minify: true,
        }),
      );
    }
  }

  get<T>(key: string) {
    return this[key] as T;
  }

  public get version() {
    return require("../../package.json").version as string;
  }

  public async getPrefix(message: Message): Promise<string | null> {
    await this.#initialization;

    for (const prefixCode of this.options.prefixes) {
      const resolved = await prefixCode.run({
        ctx: new Context({ scope: Scope.globalScope() }),
        client: this,
        command: null,
        discord: {
          message,
          user: message.author,
          guild: message.guild,
          channel: message.channel.isDMBased() ? null : message.channel,
        },
      });

      if (resolved === null || resolved === undefined) continue;
      const prefix = String(resolved);
      const content = this.options.prefixCaseInsensitive
        ? message.content.toLowerCase()
        : message.content;
      const candidate = this.options.prefixCaseInsensitive
        ? prefix.toLowerCase()
        : prefix;
      if (content.startsWith(candidate)) return prefix;
    }

    return null;
  }

  override login(token?: string | undefined): Promise<string> {
    return this.#initialization.then(() =>
      super.login(token ?? this.options.token),
    );
  }
}
