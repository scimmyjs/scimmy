import assert from "assert";

export let SchemaDefinitionSuite = async (SCIMMY) => {
    it("should include static class 'SchemaDefinition'", () => 
        assert.ok(!!SCIMMY.Types.SchemaDefinition, "Static class 'SchemaDefinition' not defined"));
    
    describe("SCIMMY.Types.SchemaDefinition", () => {
    });
}