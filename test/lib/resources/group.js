import {promises as fs} from "fs";
import path from "path";
import url from "url";
import ResourcesHooks from "../../hooks/resources.js";
import {Group} from "#@/lib/resources/group.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./group.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.Group", () => {
    const hooks = new ResourcesHooks(Group, fixtures);
    
    describe(".schema", hooks.schema(true));
    describe(".endpoint", hooks.endpoint());
    describe(".basepath()", hooks.basepath());
    describe(".extend()", hooks.extend(true));
    describe(".ingress()", hooks.ingress(true));
    describe(".egress()", hooks.egress(true));
    describe(".degress()", hooks.degress(true));
    describe("@constructor", hooks.construct(true));
    describe("#read()", hooks.read(true, true));
    describe("#write()", hooks.write(true));
    describe("#patch()", hooks.patch(true));
    describe("#dispose()", hooks.dispose(true));
});