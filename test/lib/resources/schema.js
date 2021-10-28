import assert from "assert";

export let SchemaSuite = async (SCIMMY) => {
    it("should include static class 'Schema'", () => 
        assert.ok(!!SCIMMY.Resources.Schema, "Static class 'Schema' not defined"));
    
    describe("SCIMMY.Resources.Schema", () => {
    });
}