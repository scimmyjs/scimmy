import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import SCIMMY from "#@/scimmy.js";
import {ResourcesHooks} from "../resources.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./group.json"), "utf8").then((f) => JSON.parse(f));

export const GroupSuite = () => {
    it("should include static class 'Group'", () => 
        assert.ok(!!SCIMMY.Resources.Group, "Static class 'Group' not defined"));
    
    describe("SCIMMY.Resources.Group", () => {
        it("should implement static member 'endpoint' that is a string", ResourcesHooks.endpoint(SCIMMY.Resources.Group));
        it("should implement static member 'schema' that is a Schema", ResourcesHooks.schema(SCIMMY.Resources.Group));
        it("should not override static method 'extend'", ResourcesHooks.extend(SCIMMY.Resources.Group, false));
        it("should implement static method 'ingress'", ResourcesHooks.ingress(SCIMMY.Resources.Group, fixtures));
        it("should implement static method 'egress'", ResourcesHooks.egress(SCIMMY.Resources.Group, fixtures));
        it("should implement static method 'degress'", ResourcesHooks.degress(SCIMMY.Resources.Group, fixtures));
        
        describe(".basepath()", ResourcesHooks.basepath(SCIMMY.Resources.Group));
        describe("#constructor", ResourcesHooks.construct(SCIMMY.Resources.Group));
        describe("#read()", ResourcesHooks.read(SCIMMY.Resources.Group, fixtures));
        describe("#write()", ResourcesHooks.write(SCIMMY.Resources.Group, fixtures));
        describe("#patch()", ResourcesHooks.patch(SCIMMY.Resources.Group, fixtures));
        describe("#dispose()", ResourcesHooks.dispose(SCIMMY.Resources.Group, fixtures));
    });
};