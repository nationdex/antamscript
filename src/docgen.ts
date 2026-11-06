import { join } from "node:path";
import generateMetadata from "./utils/generateMetadata";

generateMetadata({
    functionsAbsolutePath: join(import.meta.dir, "functions/native"),
    eventsAbsolutePath: join(import.meta.dir, "events/native")
})