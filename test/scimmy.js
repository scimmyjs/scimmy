import SCIMMY from "../src/scimmy.js";
import {ConfigSuite} from "./lib/config.js";
import {TypesSuite} from "./lib/types.js";
import {MessagesSuite} from "./lib/messages.js";
import {SchemasSuite} from "./lib/schemas.js";
import {ResourcesSuite} from "./lib/resources.js";

describe("SCIMMY", () => {
    ConfigSuite(SCIMMY);
    TypesSuite(SCIMMY);
    MessagesSuite(SCIMMY);
    SchemasSuite(SCIMMY);
    ResourcesSuite(SCIMMY);
})