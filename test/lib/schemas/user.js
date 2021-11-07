import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";

export let UserSuite = (SCIMMY, SchemasHooks) => {
    const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
    const fixtures = fs.readFile(path.join(basepath, "./user.json"), "utf8").then((f) => JSON.parse(f));
    
    it("should include static class 'User'", () => 
        assert.ok(!!SCIMMY.Schemas.User, "Static class 'User' not defined"));
    
    describe("SCIMMY.Schemas.User", () => {
        describe(".definition", SchemasHooks.definition(SCIMMY.Schemas.User, fixtures));
    });
}