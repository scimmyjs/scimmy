import {promises as fs} from "fs";
import path from "path";
import url from "url";
import sinon from "sinon";
import * as Resources from "#@/lib/resources.js";
import {User} from "#@/lib/resources/user.js";
import {Group} from "#@/lib/resources/group.js";
import {ResourceType} from "#@/lib/resources/resourcetype.js";
import {ResourcesHooks} from "../resources.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./resourcetype.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.ResourceType", () => {
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => {
        const declared = sandbox.stub(Resources.default, "declared");
        
        declared.returns([User, Group]);
        declared.withArgs(User.schema.definition.name).returns(User);
    });
    
    context(".endpoint", ResourcesHooks.endpoint(ResourceType));
    context(".schema", ResourcesHooks.schema(ResourceType, false));
    context(".basepath()", ResourcesHooks.basepath(ResourceType));
    context(".extend()", ResourcesHooks.extend(ResourceType, true));
    context(".ingress()", ResourcesHooks.ingress(ResourceType, false));
    context(".egress()", ResourcesHooks.egress(ResourceType, false));
    context(".degress()", ResourcesHooks.degress(ResourceType, false));
    context("@constructor", ResourcesHooks.construct(ResourceType, false));
    context("#read()", ResourcesHooks.read(ResourceType, fixtures));
    context("#write()", ResourcesHooks.write(ResourceType, false));
    context("#patch()", ResourcesHooks.patch(ResourceType, false));
    context("#dispose()", ResourcesHooks.dispose(ResourceType, false));
});