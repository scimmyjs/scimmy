import assert from "assert";
import {AttributeSuite} from "./types/attribute.js";
import {SchemaDefinitionSuite} from "./types/definition.js";
import {FilterSuite} from "./types/filter.js";
import {ErrorSuite} from "./types/error.js";
import {SchemaSuite} from "./types/schema.js";
import {ResourceSuite} from "./types/resource.js";

export let TypesSuite = (SCIMMY) => {
    it("should include static class 'Types'", () => 
        assert.ok(!!SCIMMY.Types, "Static class 'Types' not defined"));
    
    describe("SCIMMY.Types", () => {
        AttributeSuite(SCIMMY);
        SchemaDefinitionSuite(SCIMMY);
        FilterSuite(SCIMMY);
        ErrorSuite(SCIMMY);
        SchemaSuite(SCIMMY);
        ResourceSuite(SCIMMY);
    });
}