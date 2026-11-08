import { Channel, Guild } from "discord.js";
import { TranspiledResultRunData } from "../core/Transpiler";

export type GlobalImportedFunction =
  (typeof GlobalImportedFunctions)[keyof typeof GlobalImportedFunctions];

export type GlobalFunctionsNames = keyof typeof GlobalImportedFunctions;

/* special functions */
export const GlobalImportedFunctions = {
  eval: async (code: string, data: TranspiledResultRunData, minify: boolean, doNotRun = false) => {
    const result = await data.transpiler!.transpile(code, {
      ignoreText: false,
      minify,
      terminator: "$ctx.content",
    });
    if (doNotRun) return result;
    let res = await result.run({ ...data, ctx: data.ctx!.clone() });
    return res;
  },
  random: (a: number, b: number) => {
    if (a == b) return a;
    if (a > b) [a, b] = [b, a];
    return Math.random() * (b - a + 1) + a;
  },
  pickFromArray: (arr: any[]) => arr[~~(Math.random() * arr.length)],

  predicateChannelByNameOrObj: (channel: Channel, chnl: string | Channel) => {
    return !chnl
      ? false
      : (typeof chnl == "string"
          ? chnl
          : ("name" in chnl ? chnl.name : chnl.id) || chnl.id
        ).toLowerCase() ==
          (("name" in channel ? channel.name : channel.id) || channel.id).toLowerCase();
  },
  predicateChannelByIDOrObj: (channel: Channel, chnl: string | Channel) => {
    return !chnl ? false : (typeof chnl == "string" ? chnl : chnl.id) == channel.id;
  },

  predicateGuildByNameOrObj: (guild: Guild, g: string | Guild) => {
    return !g
      ? false
      : (typeof g == "string" ? g : g.name).toLowerCase() == guild.name.toLowerCase();
  },
  predicateGuildByIDOrObj: (guild: Guild, g: string | Guild) => {
    return !g ? false : (typeof g == "string" ? g : g.id) == guild.id;
  },
} as const;

export function getGlobalImportedFunctions(...names: GlobalFunctionsNames[]) {
  const functions: [string, GlobalImportedFunction][] = [];
  for (const name of names) {
    if (name in GlobalImportedFunctions) {
      functions.push([name, GlobalImportedFunctions[name]]);
    }
  }
  return functions;
}
