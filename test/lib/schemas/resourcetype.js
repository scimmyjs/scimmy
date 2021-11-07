import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";

export let ResourceTypeSuite = (SCIMMY, SchemasHooks) => {
    const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
    const fixtures = fs.readFile(path.join(basepath, "./resourcetype.json"), "utf8").then((f) => JSON.parse(f));
    
    it("should include static class 'ResourceType'", () => 
        assert.ok(!!SCIMMY.Schemas.ResourceType, "Static class 'ResourceType' not defined"));
    
    describe("SCIMMY.Schemas.ResourceType", () => {
        describe("#constructor", SchemasHooks.construct(SCIMMY.Schemas.ResourceType, fixtures));
        describe(".definition", SchemasHooks.definition(SCIMMY.Schemas.ResourceType, fixtures));
    });
}