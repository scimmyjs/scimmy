import {promises as fs} from "fs";
import path from "path";
import url from "url";
import ResourcesHooks from "../../hooks/resources.js";
import {User} from "#@/lib/resources/user.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./user.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.User", () => {
    describe(".endpoint", ResourcesHooks.endpoint(User));
    describe(".schema", ResourcesHooks.schema(User));
    describe(".basepath()", ResourcesHooks.basepath(User));
    describe(".extend()", ResourcesHooks.extend(User, false));
    describe(".ingress()", ResourcesHooks.ingress(User, fixtures));
    describe(".egress()", ResourcesHooks.egress(User, fixtures));
    describe(".degress()", ResourcesHooks.degress(User, fixtures));
    describe("@constructor", ResourcesHooks.construct(User));
    describe("#read()", ResourcesHooks.read(User, fixtures));
    describe("#write()", ResourcesHooks.write(User, fixtures));
    describe("#patch()", ResourcesHooks.patch(User, fixtures));
    describe("#dispose()", ResourcesHooks.dispose(User, fixtures));
});