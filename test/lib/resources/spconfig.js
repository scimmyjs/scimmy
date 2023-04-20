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
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => sandbox.stub(Config.default, "get").returns({
        documentationUri: undefined, authenticationSchemes: [], filter: {supported: false, maxResults: 200},
        sort: {supported: false}, bulk: {supported: false, maxOperations: 1000, maxPayloadSize: 1048576},
        patch: {supported: false}, changePassword: {supported: false}, etag: {supported: false}
    }));
    
    describe(".endpoint", ResourcesHooks.endpoint(ServiceProviderConfig));
    describe(".schema", ResourcesHooks.schema(ServiceProviderConfig, false));
    describe(".basepath()", ResourcesHooks.basepath(ServiceProviderConfig));
    describe(".extend()", ResourcesHooks.extend(ServiceProviderConfig, true));
    describe(".ingress()", ResourcesHooks.ingress(ServiceProviderConfig, false));
    describe(".egress()", ResourcesHooks.egress(ServiceProviderConfig, false));
    describe(".degress()", ResourcesHooks.degress(ServiceProviderConfig, false));
    describe("@constructor", ResourcesHooks.construct(ServiceProviderConfig, false));
    describe("#read()", ResourcesHooks.read(ServiceProviderConfig, fixtures, false));
    describe("#write()", ResourcesHooks.write(ServiceProviderConfig, false));
    describe("#patch()", ResourcesHooks.patch(ServiceProviderConfig, false));
    describe("#dispose()", ResourcesHooks.dispose(ServiceProviderConfig, false));
});