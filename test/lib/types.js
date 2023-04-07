import assert from "assert";
import SCIMMY from "#@/scimmy.js";
import {AttributeSuite} from "./types/attribute.js";
import {SchemaDefinitionSuite} from "./types/definition.js";
import {FilterSuite} from "./types/filter.js";
import {ErrorSuite} from "./types/error.js";
import {SchemaSuite} from "./types/schema.js";
import {ResourceSuite} from "./types/resource.js";

export const TypesSuite = () => {
    it("should include static class 'Types'", () => 
        assert.ok(!!SCIMMY.Types, "Static class 'Types' not defined"));
    
    describe("SCIMMY.Types", () => {
        AttributeSuite();
        SchemaDefinitionSuite();
        FilterSuite();
        ErrorSuite();
        SchemaSuite();
        ResourceSuite();
    });
};