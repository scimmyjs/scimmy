import {promises as fs} from "fs";
import path from "path";
import url from "url";
import SchemasHooks from "../../hooks/schemas.js";
import {User} from "#@/lib/schemas/user.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./user.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Schemas.User", () => {
    const hooks = new SchemasHooks(User, fixtures);
    
    describe(".definition", hooks.definition());
    describe("@constructor", hooks.construct());
});