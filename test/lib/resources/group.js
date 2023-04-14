import {promises as fs} from "fs";
import path from "path";
import url from "url";
import {ResourcesHooks} from "../resources.js";
import {Group} from "#@/lib/resources/group.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./group.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.Group", () => {
    describe(".endpoint", ResourcesHooks.endpoint(Group));
    describe(".schema", ResourcesHooks.schema(Group));
    describe(".basepath()", ResourcesHooks.basepath(Group));
    describe(".extend()", ResourcesHooks.extend(Group, false));
    describe(".ingress()", ResourcesHooks.ingress(Group, fixtures));
    describe(".egress()", ResourcesHooks.egress(Group, fixtures));
    describe(".degress()", ResourcesHooks.degress(Group, fixtures));
    describe("@constructor", ResourcesHooks.construct(Group));
    describe("#read()", ResourcesHooks.read(Group, fixtures));
    describe("#write()", ResourcesHooks.write(Group, fixtures));
    describe("#patch()", ResourcesHooks.patch(Group, fixtures));
    describe("#dispose()", ResourcesHooks.dispose(Group, fixtures));
});