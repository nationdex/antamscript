import { DiscordEventHandler } from "../../discordjs/DiscordEventHandler";

export default new DiscordEventHandler({
  name: "clientReady",
  description: "This event is fired when the bot becomes ready",
  listener: async function () {
    console.info(`Ready on client ${this.user.displayName}`);
  },
});
