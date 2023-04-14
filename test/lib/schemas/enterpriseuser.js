import {promises as fs} from "fs";
import path from "path";
import url from "url";
import {SchemasHooks} from "../schemas.js";
import {EnterpriseUser} from "#@/lib/schemas/enterpriseuser.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./enterpriseuser.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Schemas.EnterpriseUser", () => {
    describe(".definition", SchemasHooks.definition(EnterpriseUser, fixtures));
    describe("@constructor", SchemasHooks.construct(EnterpriseUser, fixtures));
});