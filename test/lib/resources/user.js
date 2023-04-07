import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import SCIMMY from "#@/scimmy.js";
import {ResourcesHooks} from "../resources.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./user.json"), "utf8").then((f) => JSON.parse(f));

export const UserSuite = () => {
    it("should include static class 'User'", () => 
        assert.ok(!!SCIMMY.Resources.User, "Static class 'User' not defined"));
    
    describe("SCIMMY.Resources.User", () => {
        it("should implement static member 'endpoint' that is a string", ResourcesHooks.endpoint(SCIMMY.Resources.User));
        it("should implement static member 'schema' that is a Schema", ResourcesHooks.schema(SCIMMY.Resources.User));
        it("should implement static member 'extensions' that is an array", ResourcesHooks.extensions(SCIMMY.Resources.User));
        it("should not override static method 'extend'", ResourcesHooks.extend(SCIMMY.Resources.User, false));
        it("should implement static method 'ingress'", ResourcesHooks.ingress(SCIMMY.Resources.User, fixtures));
        it("should implement static method 'egress'", ResourcesHooks.egress(SCIMMY.Resources.User, fixtures));
        it("should implement static method 'degress'", ResourcesHooks.degress(SCIMMY.Resources.User, fixtures));
        
        describe(".basepath()", ResourcesHooks.basepath(SCIMMY.Resources.User));
        describe("#constructor", ResourcesHooks.construct(SCIMMY.Resources.User));
        describe("#read()", ResourcesHooks.read(SCIMMY.Resources.User, fixtures));
        describe("#write()", ResourcesHooks.write(SCIMMY.Resources.User, fixtures));
        describe("#patch()", ResourcesHooks.patch(SCIMMY.Resources.User, fixtures));
        describe("#dispose()", ResourcesHooks.dispose(SCIMMY.Resources.User, fixtures));
    });
};