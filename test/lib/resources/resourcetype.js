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
    const hooks = new ResourcesHooks(ResourceType, fixtures);
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => {
        sandbox.stub(Resources.default, "declared")
            .returns([User, Group])
            .withArgs(User.schema.definition.name).returns(User);
    });
    
    describe(".schema", hooks.schema(false));
    describe(".endpoint", hooks.endpoint());
    describe(".basepath()", hooks.basepath());
    describe(".extend()", hooks.extend(false));
    describe(".ingress()", hooks.ingress(false));
    describe(".egress()", hooks.egress(false));
    describe(".degress()", hooks.degress(false));
    describe("@constructor", hooks.construct(false));
    describe("#read()", hooks.read(true));
    describe("#write()", hooks.write(false));
    describe("#patch()", hooks.patch(false));
    describe("#dispose()", hooks.dispose(false));
});