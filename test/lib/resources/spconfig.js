import {promises as fs} from "fs";
import path from "path";
import url from "url";
import sinon from "sinon";
import * as Config from "#@/lib/config.js";
import ResourcesHooks from "../../hooks/resources.js";
import {ServiceProviderConfig} from "#@/lib/resources/spconfig.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./spconfig.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.ServiceProviderConfig", () => {
    const hooks = new ResourcesHooks(ServiceProviderConfig, fixtures);
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => sandbox.stub(Config.default, "get").returns({
        documentationUri: undefined, authenticationSchemes: [], filter: {supported: false, maxResults: 200},
        sort: {supported: false}, bulk: {supported: false, maxOperations: 1000, maxPayloadSize: 1048576},
        patch: {supported: false}, changePassword: {supported: false}, etag: {supported: false}
    }));
    
    describe(".schema", hooks.schema(false));
    describe(".endpoint", hooks.endpoint());
    describe(".basepath()", hooks.basepath());
    describe(".extend()", hooks.extend(false));
    describe(".ingress()", hooks.ingress(false));
    describe(".egress()", hooks.egress(false));
    describe(".degress()", hooks.degress(false));
    describe("@constructor", hooks.construct(false));
    describe("#read()", hooks.read(false));
    describe("#write()", hooks.write(false));
    describe("#patch()", hooks.patch(false));
    describe("#dispose()", hooks.dispose(false));
});