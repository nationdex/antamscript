import { BaseCommand } from "../../../src";

export default new BaseCommand({
  type: "messageCreate",
  name: "ping",
  code: `
    $let[ping;$ping]
    $let[ping_status;$ternary[$get[ping]==-1;Pong!;Pong! $get[ping]ms]]
    $sendMessage[$channelID;$get[ping_status]]
    `,
});
