import assert from "assert";

export let ResourceTypeSuite = async (SCIMMY) => {
    it("should include static class 'ResourceType'", () => 
        assert.ok(!!SCIMMY.Resources.ResourceType, "Static class 'ResourceType' not defined"));
    
    describe("SCIMMY.Resources.ResourceType", () => {
    });
}