import assert from "assert";

export let AttributeSuite = async (SCIMMY) => {
    it("should include static class 'Attribute'", () => 
        assert.ok(!!SCIMMY.Types.Attribute, "Static class 'Attribute' not defined"));
    
    describe("SCIMMY.Types.Attribute", () => {
    });
}