import {promises as fs} from "fs";
import path from "path";
import url from "url";
import sinon from "sinon";
import * as Config from "#@/lib/config.js";
import {ServiceProviderConfig} from "#@/lib/resources/spconfig.js";
import {ResourcesHooks} from "../resources.js";

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
    
    context(".endpoint", ResourcesHooks.endpoint(ServiceProviderConfig));
    context(".schema", ResourcesHooks.schema(ServiceProviderConfig, false));
    context(".basepath()", ResourcesHooks.basepath(ServiceProviderConfig));
    context(".extend()", ResourcesHooks.extend(ServiceProviderConfig, true));
    context(".ingress()", ResourcesHooks.ingress(ServiceProviderConfig, false));
    context(".egress()", ResourcesHooks.egress(ServiceProviderConfig, false));
    context(".degress()", ResourcesHooks.degress(ServiceProviderConfig, false));
    context("@constructor", ResourcesHooks.construct(ServiceProviderConfig, false));
    context("#read()", ResourcesHooks.read(ServiceProviderConfig, fixtures, false));
    context("#write()", ResourcesHooks.write(ServiceProviderConfig, false));
    context("#patch()", ResourcesHooks.patch(ServiceProviderConfig, false));
    context("#dispose()", ResourcesHooks.dispose(ServiceProviderConfig, false));
});