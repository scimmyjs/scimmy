import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import SCIMMY from "#@/scimmy.js";
import {SchemasHooks} from "../schemas.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./group.json"), "utf8").then((f) => JSON.parse(f));

export const GroupSuite = () => {
    it("should include static class 'Group'", () => 
        assert.ok(!!SCIMMY.Schemas.Group, "Static class 'Group' not defined"));
    
    describe("SCIMMY.Schemas.Group", () => {
        describe("#constructor", SchemasHooks.construct(SCIMMY.Schemas.Group, fixtures));
        describe(".definition", SchemasHooks.definition(SCIMMY.Schemas.Group, fixtures));
    });
};