import {promises as fs} from "fs";
import path from "path";
import url from "url";
import SchemasHooks from "../../hooks/schemas.js";
import {EnterpriseUser} from "#@/lib/schemas/enterpriseuser.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./enterpriseuser.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Schemas.EnterpriseUser", () => {
    const hooks = new SchemasHooks(EnterpriseUser, fixtures);
    
    describe(".id", hooks.id());
    describe(".definition", hooks.definition());
    describe("@constructor", hooks.construct());
});