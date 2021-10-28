import assert from "assert";

export let ResourceTypeSuite = async (SCIMMY) => {
    it("should include static class 'ResourceType'", () => 
        assert.ok(!!SCIMMY.Schemas.ResourceType, "Static class 'ResourceType' not defined"));
    
    describe("SCIMMY.Schemas.ResourceType", () => {
    });
}