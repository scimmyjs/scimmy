import assert from "assert";

export let ResourceSuite = async (SCIMMY) => {
    it("should include static class 'Resource'", () => 
        assert.ok(!!SCIMMY.Types.Resource, "Static class 'Resource' not defined"));
    
    describe("SCIMMY.Types.Resource", () => {
    });
}