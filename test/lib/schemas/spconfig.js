import {promises as fs} from "fs";
import path from "path";
import url from "url";
import SchemasHooks from "../../hooks/schemas.js";
import {ServiceProviderConfig} from "#@/lib/schemas/spconfig.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./spconfig.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Schemas.ServiceProviderConfig", () => {
    const hooks = new SchemasHooks(ServiceProviderConfig, fixtures);
    
    describe(".id", hooks.id());
    describe(".definition", hooks.definition());
    describe("@constructor", hooks.construct());
});