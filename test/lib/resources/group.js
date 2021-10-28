import assert from "assert";

export let GroupSuite = async (SCIMMY) => {
    it("should include static class 'Group'", () => 
        assert.ok(!!SCIMMY.Resources.Group, "Static class 'Group' not defined"));
    
    describe("SCIMMY.Resources.Group", () => {
    });
}