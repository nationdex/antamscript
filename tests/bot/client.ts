import { AntamClient, FunctionManager, IArg, Parser } from "../../src";

const client = new AntamClient({
  events: ["clientReady", "messageCreate"],
  intents: ["Guilds", "GuildMessages", "MessageContent"],
  prefixes: ["t", "<@$clientID>", "<@!$clientID>"],
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
  $if[$authorID==910837428862984213;$let[a;$eval[$message]]]
  $get[a]
  `,
});

client.commands.load("./tests/bot/commands");

// client.commands.add({
//   type: "messageCreate",
//   name: "transpile",
//   aliases: ["t"],
//   code: `
//   $let[code;$message]
//   $let[toMinify;false]
//   $if[$includes[$get[code];--minify];
//     $let[toMinify;true]
//     $let[code;$replace[$get[code];--minify;]]
//   ]
//   $let[result;$transpile[$get[toMinify];$get[code]]]
//   $sendMessage[$channelID;\`\`\`js\n$get[result]\n\`\`\`;false]
//   `,
// });

client.login(process.env.DISCORD_TOKEN);
