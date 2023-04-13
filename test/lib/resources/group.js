import {promises as fs} from "fs";
import path from "path";
import url from "url";
import {Group} from "#@/lib/resources/group.js";
import {ResourcesHooks} from "../resources.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./group.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.Group", () => {
    context(".endpoint", ResourcesHooks.endpoint(Group));
    context(".schema", ResourcesHooks.schema(Group));
    context(".basepath()", ResourcesHooks.basepath(Group));
    context(".extend()", ResourcesHooks.extend(Group, false));
    context(".ingress()", ResourcesHooks.ingress(Group, fixtures));
    context(".egress()", ResourcesHooks.egress(Group, fixtures));
    context(".degress()", ResourcesHooks.degress(Group, fixtures));
    context("@constructor", ResourcesHooks.construct(Group));
    context("#read()", ResourcesHooks.read(Group, fixtures));
    context("#write()", ResourcesHooks.write(Group, fixtures));
    context("#patch()", ResourcesHooks.patch(Group, fixtures));
    context("#dispose()", ResourcesHooks.dispose(Group, fixtures));
});