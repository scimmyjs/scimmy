import assert from "assert";

export let UserSuite = async (SCIMMY) => {
    it("should include static class 'User'", () => 
        assert.ok(!!SCIMMY.Schemas.User, "Static class 'User' not defined"));
    
    describe("SCIMMY.Schemas.User", () => {
    });
}