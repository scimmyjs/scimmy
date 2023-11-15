import assert from "assert";
import SCIMMY from "#@/scimmy.js";

describe("SCIMMY.Types", () => {
    it("should include static class 'Attribute'", () => {
        assert.ok(!!SCIMMY.Types.Attribute,
            "Static class 'Attribute' not defined");
    });
    
    it("should include static class 'SchemaDefinition'", () => {
        assert.ok(!!SCIMMY.Types.SchemaDefinition,
            "Static class 'SchemaDefinition' not defined");
    });
    
    it("should include static class 'Error'", () => {
        assert.ok(!!SCIMMY.Types.Error,
            "Static class 'Error' not defined");
    });
    
    it("should include static class 'Filter'", () => {
        assert.ok(!!SCIMMY.Types.Filter,
            "Static class 'Filter' not defined");
    });
    
    it("should include static class 'Resource'", () => {
        assert.ok(!!SCIMMY.Types.Resource,
            "Static class 'Resource' not defined");
    });
    
    it("should include static class 'Schema'", () => {
        assert.ok(!!SCIMMY.Types.Schema,
            "Static class 'Schema' not defined");
    });
});