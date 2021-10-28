import assert from "assert";

export let SchemaSuite = async (SCIMMY) => {
    it("should include static class 'Schema'", () => 
        assert.ok(!!SCIMMY.Types.Schema, "Static class 'Schema' not defined"));
    
    describe("SCIMMY.Types.Schema", () => {
    });
}