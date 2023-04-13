import {promises as fs} from "fs";
import path from "path";
import url from "url";
import {User} from "#@/lib/resources/user.js";
import {ResourcesHooks} from "../resources.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./user.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Resources.User", () => {
    context(".endpoint", ResourcesHooks.endpoint(User));
    context(".schema", ResourcesHooks.schema(User));
    context(".basepath()", ResourcesHooks.basepath(User));
    context(".extend()", ResourcesHooks.extend(User, false));
    context(".ingress()", ResourcesHooks.ingress(User, fixtures));
    context(".egress()", ResourcesHooks.egress(User, fixtures));
    context(".degress()", ResourcesHooks.degress(User, fixtures));
    context("@constructor", ResourcesHooks.construct(User));
    context("#read()", ResourcesHooks.read(User, fixtures));
    context("#write()", ResourcesHooks.write(User, fixtures));
    context("#patch()", ResourcesHooks.patch(User, fixtures));
    context("#dispose()", ResourcesHooks.dispose(User, fixtures));
});