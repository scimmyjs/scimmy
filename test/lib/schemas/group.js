import {promises as fs} from "fs";
import path from "path";
import url from "url";
import SchemasHooks from "../../hooks/schemas.js";
import {Group} from "#@/lib/schemas/group.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./group.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Schemas.Group", () => {
    describe(".definition", SchemasHooks.definition(Group, fixtures));
    describe("@constructor", SchemasHooks.construct(Group, fixtures));
});