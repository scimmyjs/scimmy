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
    const hooks = new ResourcesHooks(Schema, fixtures);
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => {
        sandbox.stub(Schemas.default, "declared")
            .returns([User.definition, Group.definition])
            .withArgs(User.definition.id).returns(User.definition);
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