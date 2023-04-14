import {promises as fs} from "fs";
import path from "path";
import url from "url";
import {SchemasHooks} from "../schemas.js";
import {ServiceProviderConfig} from "#@/lib/schemas/spconfig.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./spconfig.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Schemas.ServiceProviderConfig", () => {
    describe(".definition", SchemasHooks.definition(ServiceProviderConfig, fixtures));
    describe("@constructor", SchemasHooks.construct(ServiceProviderConfig, fixtures));
});