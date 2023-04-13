import {promises as fs} from "fs";
import path from "path";
import url from "url";
import sinon from "sinon";
import * as Schemas from "#@/lib/schemas.js";
import {User} from "#@/lib/schemas/user.js";
import {Group} from "#@/lib/schemas/group.js";
import {Schema} from "#@/lib/resources/schema.js";
import {ResourcesHooks} from "../resources.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./schema.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.Schema", () => {
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => {
        const declared = sandbox.stub(Schemas.default, "declared");
        
        declared.returns([User.definition, Group.definition]);
        declared.withArgs(User.definition.id).returns(User.definition);
    });
    
    context(".endpoint", ResourcesHooks.endpoint(Schema));
    context(".schema", ResourcesHooks.schema(Schema, false));
    context(".basepath()", ResourcesHooks.basepath(Schema));
    context(".extend()", ResourcesHooks.extend(Schema, true));
    context(".ingress()", ResourcesHooks.ingress(Schema, false));
    context(".egress()", ResourcesHooks.egress(Schema, false));
    context(".degress()", ResourcesHooks.degress(Schema, false));
    context("@constructor", ResourcesHooks.construct(Schema, false));
    context("#read()", ResourcesHooks.read(Schema, fixtures));
    context("#write()", ResourcesHooks.write(Schema, false));
    context("#patch()", ResourcesHooks.patch(Schema, false));
    context("#dispose()", ResourcesHooks.dispose(Schema, false));
});