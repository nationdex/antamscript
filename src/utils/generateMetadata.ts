import { existsSync, mkdirSync, writeFileSync } from "fs";
import { FunctionManager, EventsManager } from "../managers";
import { join, relative } from "path";
import { cwd } from "process";
import { ArgType, FunctionOutputType } from "../structure";

export interface IMetadataGeneration {
  /** The absolute path to the functions directory. */
  functionsAbsolutePath?: string;

  /** The absolute path to the events directory. */
  eventsAbsolutePath?: string;

  /** Metadata folder */
  metadataFolder?: string;
}

const toSrcPath = (absPath: string) => relative(cwd(), absPath).replace(/\\/g, "/");

export default async function generateMetadata(options: IMetadataGeneration) {
  const metadataFolder = options.metadataFolder ?? "metadata";

  // Ensure metadataFolder exists
  if (!existsSync(metadataFolder)) {
    mkdirSync(metadataFolder, { recursive: true });
  }

  // Paths file
  writeFileSync(
    join(metadataFolder, "paths.json"),
    JSON.stringify({
      function: options.functionsAbsolutePath
        ? toSrcPath(options.functionsAbsolutePath)
        : undefined,
      event: options.eventsAbsolutePath ? toSrcPath(options.eventsAbsolutePath) : undefined,
    }),
  );

  // Functions metadata
  if (options.functionsAbsolutePath) {
    console.info(`Loading functions from ${options.functionsAbsolutePath}`);
    FunctionManager.load("Metadata", options.functionsAbsolutePath);
    const functionsData = FunctionManager.toJSON();
    // fix ArgType
    const reverse = (t: FunctionOutputType) => {
      // Preserve the original structure: if the input is an array, return an array of converted types;
      // if it's a single value, return the converted single value.
      const convert = (v: any) => {
        if (v == "void") return v;
        if (typeof v == "object") return v;
        return ArgType[v as any];
      };
      if (Array.isArray(t)) {
        return t.map(convert);
      }
      return convert(t);
    };
    functionsData.forEach((func) => {
      if (func.args) {
        func.args.forEach((arg) => {
          arg.type = reverse(arg.type) as any;
          if (arg.allow) {
            arg.allow = reverse(arg.allow) as any;
          }
        });
      }
      func.output = reverse(func.output) as any;
    });
    console.info(`Loaded ${functionsData.length} functions`);

    writeFileSync(join(metadataFolder, "functions.json"), JSON.stringify(functionsData));
  }

  // Events metadata
  if (options.eventsAbsolutePath) {
    console.info(`Loading events from ${options.eventsAbsolutePath}`);
    EventsManager.load("Metadata", options.eventsAbsolutePath);
    const eventsData = EventsManager.toJSON("Metadata");
    console.info(`Loaded ${eventsData.length} events`);

    writeFileSync(join(metadataFolder, "events.json"), JSON.stringify(eventsData));
  }

  console.info(`Metadata successfully generated into "${metadataFolder}" folder.`);
}
