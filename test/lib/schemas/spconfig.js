import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";

export let ServiceProviderConfigSuite = (SCIMMY, SchemasHooks) => {
    const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
    const fixtures = fs.readFile(path.join(basepath, "./spconfig.json"), "utf8").then((f) => JSON.parse(f));
    
    it("should include static class 'ServiceProviderConfig'", () => 
        assert.ok(!!SCIMMY.Schemas.ServiceProviderConfig, "Static class 'ServiceProviderConfig' not defined"));
    
    describe("SCIMMY.Schemas.ServiceProviderConfig", () => {
        describe(".definition", SchemasHooks.definition(SCIMMY.Schemas.ServiceProviderConfig, fixtures));
    });
}