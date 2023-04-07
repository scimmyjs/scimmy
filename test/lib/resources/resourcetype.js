import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import SCIMMY from "#@/scimmy.js";
import {ResourcesHooks} from "../resources.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./resourcetype.json"), "utf8").then((f) => JSON.parse(f));

export const ResourceTypeSuite = () => {
    it("should include static class 'ResourceType'", () => 
        assert.ok(!!SCIMMY.Resources.ResourceType, "Static class 'ResourceType' not defined"));
    
    describe("SCIMMY.Resources.ResourceType", () => {
        it("should implement static member 'endpoint' that is a string", ResourcesHooks.endpoint(SCIMMY.Resources.ResourceType));
        it("should not implement static member 'schema'", ResourcesHooks.schema(SCIMMY.Resources.ResourceType, false));
        it("should not implement static member 'extensions'", ResourcesHooks.extensions(SCIMMY.Resources.ResourceType, false));
        it("should override static method 'extend'", ResourcesHooks.extend(SCIMMY.Resources.ResourceType, true));
        it("should not implement static method 'ingress'", ResourcesHooks.ingress(SCIMMY.Resources.ResourceType, false));
        it("should not implement static method 'egress'", ResourcesHooks.egress(SCIMMY.Resources.ResourceType, false));
        it("should not implement static method 'degress'", ResourcesHooks.degress(SCIMMY.Resources.ResourceType, false));
        it("should not implement instance method 'write'", ResourcesHooks.write(SCIMMY.Resources.ResourceType, false));
        it("should not implement instance method 'patch'", ResourcesHooks.patch(SCIMMY.Resources.ResourceType, false));
        it("should not implement instance method 'dispose'", ResourcesHooks.dispose(SCIMMY.Resources.ResourceType, false));
        
        describe(".basepath()", ResourcesHooks.basepath(SCIMMY.Resources.ResourceType));
        describe("#constructor", ResourcesHooks.construct(SCIMMY.Resources.ResourceType, false));
        describe("#read()", ResourcesHooks.read(SCIMMY.Resources.ResourceType, fixtures));
    });
};