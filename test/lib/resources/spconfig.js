import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import SCIMMY from "#@/scimmy.js";
import {ResourcesHooks} from "../resources.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./spconfig.json"), "utf8").then((f) => JSON.parse(f));

export const ServiceProviderConfigSuite = () => {
    it("should include static class 'ServiceProviderConfig'", () => 
        assert.ok(!!SCIMMY.Resources.ServiceProviderConfig, "Static class 'ServiceProviderConfig' not defined"));
    
    describe("SCIMMY.Resources.ServiceProviderConfig", () => {
        it("should implement static member 'endpoint' that is a string", ResourcesHooks.endpoint(SCIMMY.Resources.ServiceProviderConfig));
        it("should not implement static member 'schema'", ResourcesHooks.schema(SCIMMY.Resources.ServiceProviderConfig, false));
        it("should override static method 'extend'", ResourcesHooks.extend(SCIMMY.Resources.ServiceProviderConfig, true));
        it("should not implement static method 'ingress'", ResourcesHooks.ingress(SCIMMY.Resources.ServiceProviderConfig, false));
        it("should not implement static method 'egress'", ResourcesHooks.egress(SCIMMY.Resources.ServiceProviderConfig, false));
        it("should not implement static method 'degress'", ResourcesHooks.degress(SCIMMY.Resources.ServiceProviderConfig, false));
        it("should not implement instance method 'write'", ResourcesHooks.write(SCIMMY.Resources.ServiceProviderConfig, false));
        it("should not implement instance method 'patch'", ResourcesHooks.patch(SCIMMY.Resources.ServiceProviderConfig, false));
        it("should not implement instance method 'dispose'", ResourcesHooks.dispose(SCIMMY.Resources.ServiceProviderConfig, false));
        
        describe(".basepath()", ResourcesHooks.basepath(SCIMMY.Resources.ServiceProviderConfig));
        describe("#constructor", ResourcesHooks.construct(SCIMMY.Resources.ServiceProviderConfig, false));
        describe("#read()", ResourcesHooks.read(SCIMMY.Resources.ServiceProviderConfig, fixtures, false));
    });
};