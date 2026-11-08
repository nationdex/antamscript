import { existsSync, mkdirSync, writeFileSync } from "fs";
import { FunctionManager, EventsManager } from "../managers";
import { join, relative } from "path";
import { cwd } from "process";

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
