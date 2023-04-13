import {promises as fs} from "fs";
import path from "path";
import url from "url";
import {Group} from "#@/lib/schemas/group.js";
import {SchemasHooks} from "../schemas.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./group.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Schemas.Group", () => {
    describe(".definition", SchemasHooks.definition(Group, fixtures));
    describe("@constructor", SchemasHooks.construct(Group, fixtures));
});