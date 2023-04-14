import {promises as fs} from "fs";
import path from "path";
import url from "url";
import {SchemasHooks} from "../schemas.js";
import {User} from "#@/lib/schemas/user.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./user.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Schemas.User", () => {
    describe(".definition", SchemasHooks.definition(User, fixtures));
    describe("@constructor", SchemasHooks.construct(User, fixtures));
});