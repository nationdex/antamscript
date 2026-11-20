import { AntamClient, ArgType, FunctionManager, IArg, Parser } from "../../src";

const client = new AntamClient({
  events: ["clientReady", "messageCreate"],
  intents: ["Guilds", "GuildMessages", "MessageContent"],
  prefixes: ["t", "<@$clientID>", "<@!$clientID>"],
  functions: "./tests/bot/customFunctions",
  mobile: true,
});

client.functions.add({
  name: "discordNitro",
  code: `$return[https://discord.nitro/$randomString[16]]`,
});
client.functions.add({
  name: "f",
  brackets: true,
  args: [
    "a",
    {
      name: "b",
      type: ArgType.Number,
      allow: [ArgType.Number],
      required: true,
    },
  ],
  code: `$return[$sum[$env[a];$multi[$env[b];8]]]`,
});

client.commands.add({
  type: "clientReady",
  code: "$log[ready]",
});

client.commands.add({
  type: "messageCreate",
  name: "eval",
  aliases: ["e"],
  code: `
  $if[$authorID==910837428862984213;$var[a;$eval[$message]]]
  $get[a]
  `,
});

client.commands.load("./tests/bot/commands");
client.login(process.env.DISCORD_TOKEN);
