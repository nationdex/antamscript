import { AntamClient } from "../src";

const client = new AntamClient({
  events: ["clientReady", "messageCreate"],
  intents: ["Guilds", "GuildMessages", "MessageContent"],
  prefixes: ["t", "$add[20;20]"],
});

client.commands.add({
  type: "clientReady",
  code: "$log[ready]",
});

client.commands.add({
  type: "messageCreate",
  name: "ping",
  code: `$let[p;$ping]
  $let[k;$ternary[$get[p]==-1;Pong!;Pong! $get[p]ms]]
  $sendMessage[$channelID;$get[k] <- good?;false]
  `,
});

client.commands.add({
  type: "messageCreate",
  name: "eval",
  code: `
  $let[result;$eval[$message]]
  $!sendMessage[$channelID;eval -> $get[result];false]
  `,
});
client.commands.add({
  type: "messageCreate",
  name: "code",
  code: `
  $let[code;$message]
  $let[toMinify;false]
  $if[$includes[$get[code];--minify];
    $let[toMinify;true]
    $let[code;$replace[$get[code];--minify;]]
  ]
  $let[result;$transpile[$get[toMinify];$get[code]]]
  $sendMessage[$channelID;\`\`\`js\n$get[result]\n\`\`\`;false]
  `,
});

client.commands.add({
  type: "messageCreate",
  name: "sum",
  code: `$sum[30;20] $executionTimems
  `,
});

client.login(process.env.DISCORD_TOKEN);
