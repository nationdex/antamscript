import {
  AntamFunction,
  ArgType,
  Code,
  FunctionType,
} from "../../../../structure";

export default new AntamFunction({
  name: "usersCount",
  description: "Returns the number of users in the client's user cache",
  type: FunctionType.Getter,
  output: ArgType.Number,
  transpile(ctx) {
    return this.success(
      ctx,
      ArgType.Number,
      `${Code.reservedNames.client}.users.cache.size`,
    );
  },
});
