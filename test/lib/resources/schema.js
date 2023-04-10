import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import SCIMMY from "#@/scimmy.js";
import {ResourcesHooks} from "../resources.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./schema.json"), "utf8").then((f) => JSON.parse(f));

export const SchemaSuite = () => {
    it("should include static class 'Schema'", () => 
        assert.ok(!!SCIMMY.Resources.Schema, "Static class 'Schema' not defined"));
    
    describe("SCIMMY.Resources.Schema", () => {
        it("should implement static member 'endpoint' that is a string", ResourcesHooks.endpoint(SCIMMY.Resources.Schema));
        it("should not implement static member 'schema'", ResourcesHooks.schema(SCIMMY.Resources.Schema, false));
        it("should override static method 'extend'", ResourcesHooks.extend(SCIMMY.Resources.Schema, true));
        it("should not implement static method 'ingress'", ResourcesHooks.ingress(SCIMMY.Resources.Schema, false));
        it("should not implement static method 'egress'", ResourcesHooks.egress(SCIMMY.Resources.Schema, false));
        it("should not implement static method 'degress'", ResourcesHooks.degress(SCIMMY.Resources.Schema, false));
        it("should not implement instance method 'write'", ResourcesHooks.write(SCIMMY.Resources.Schema, false));
        it("should not implement instance method 'patch'", ResourcesHooks.patch(SCIMMY.Resources.Schema, false));
        it("should not implement instance method 'dispose'", ResourcesHooks.dispose(SCIMMY.Resources.Schema, false));
        
        describe(".basepath()", ResourcesHooks.basepath(SCIMMY.Resources.Schema));
        describe("#constructor", ResourcesHooks.construct(SCIMMY.Resources.Schema, false));
        describe("#read()", ResourcesHooks.read(SCIMMY.Resources.Schema, fixtures));
    });
};