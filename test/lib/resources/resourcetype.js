import {promises as fs} from "fs";
import path from "path";
import url from "url";
import sinon from "sinon";
import * as Resources from "#@/lib/resources.js";
import {User} from "#@/lib/resources/user.js";
import {Group} from "#@/lib/resources/group.js";
import ResourcesHooks from "../../hooks/resources.js";
import {ResourceType} from "#@/lib/resources/resourcetype.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./resourcetype.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.ResourceType", () => {
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => {
        sandbox.stub(Resources.default, "declared")
            .returns([User, Group])
            .withArgs(User.schema.definition.name).returns(User);
    });
    
    describe(".endpoint", ResourcesHooks.endpoint(ResourceType));
    describe(".schema", ResourcesHooks.schema(ResourceType, false));
    describe(".basepath()", ResourcesHooks.basepath(ResourceType));
    describe(".extend()", ResourcesHooks.extend(ResourceType, true));
    describe(".ingress()", ResourcesHooks.ingress(ResourceType, false));
    describe(".egress()", ResourcesHooks.egress(ResourceType, false));
    describe(".degress()", ResourcesHooks.degress(ResourceType, false));
    describe("@constructor", ResourcesHooks.construct(ResourceType, false));
    describe("#read()", ResourcesHooks.read(ResourceType, fixtures));
    describe("#write()", ResourcesHooks.write(ResourceType, false));
    describe("#patch()", ResourcesHooks.patch(ResourceType, false));
    describe("#dispose()", ResourcesHooks.dispose(ResourceType, false));
});