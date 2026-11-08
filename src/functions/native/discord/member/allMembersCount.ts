import { AntamFunction, ArgType, Code, FunctionType } from "../../../../structure";

export default new AntamFunction({
  name: "allMembersCount",
  aliases: ["membersCount"],
  description: "Returns the sum of member counts across cached guilds",
  type: FunctionType.Getter,
  output: ArgType.Number,
  transpile(ctx) {
    return this.success(
      ctx,
      ArgType.Number,
      `${Code.reservedNames.client}.guilds.cache.reduce((count, guild) => count + guild.memberCount, 0)`,
    );
  },
});
