import {promises as fs} from "fs";
import path from "path";
import url from "url";
import sinon from "sinon";
import * as Schemas from "#@/lib/schemas.js";
import {User} from "#@/lib/schemas/user.js";
import {Group} from "#@/lib/schemas/group.js";
import ResourcesHooks from "../../hooks/resources.js";
import {Schema} from "#@/lib/resources/schema.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./schema.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.Schema", () => {
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => {
        sandbox.stub(Schemas.default, "declared")
            .returns([User.definition, Group.definition])
            .withArgs(User.definition.id).returns(User.definition);
    });
    
    describe(".endpoint", ResourcesHooks.endpoint(Schema));
    describe(".schema", ResourcesHooks.schema(Schema, false));
    describe(".basepath()", ResourcesHooks.basepath(Schema));
    describe(".extend()", ResourcesHooks.extend(Schema, true));
    describe(".ingress()", ResourcesHooks.ingress(Schema, false));
    describe(".egress()", ResourcesHooks.egress(Schema, false));
    describe(".degress()", ResourcesHooks.degress(Schema, false));
    describe("@constructor", ResourcesHooks.construct(Schema, false));
    describe("#read()", ResourcesHooks.read(Schema, fixtures));
    describe("#write()", ResourcesHooks.write(Schema, false));
    describe("#patch()", ResourcesHooks.patch(Schema, false));
    describe("#dispose()", ResourcesHooks.dispose(Schema, false));
});