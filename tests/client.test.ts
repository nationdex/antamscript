import { AntamClient, FunctionManager, IArg, Parser } from "../src";

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
  aliases: ["e"],
  code: `
  $if[$authorID==910837428862984213;$let[a;$eval[$message]]]
  $get[a]
  `,
});
client.commands.add({
  type: "messageCreate",
  name: "transpile",
  aliases: ["t"],
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
const functionList = FunctionManager.toJSON()
  .map(
    (x) =>
      `\`${Parser.GlobalFunctionConfig.functionHead + x.name}${
        x.brackets == undefined
          ? ""
          : Parser.GlobalFunctionConfig.parentheses[0] +
            (x.args ?? [])
              ?.map((x: IArg) => `${x.rest ? "..." : ""}${x.name}${!x.required ? "?" : ""}`)
              .join(Parser.GlobalFunctionConfig.argSplitter) +
            Parser.GlobalFunctionConfig.parentheses[1]
      }\``,
  )
  .sort()
  .join("\n");
client.commands.add({
  type: "messageCreate",
  name: "functions",
  aliases: ["f"],
  code: `
  $esc[>>> ${functionList}]
  `,
});

client.login(process.env.DISCORD_TOKEN);
