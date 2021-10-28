import assert from "assert";

export let EnterpriseUserSuite = async (SCIMMY) => {
    it("should include static class 'EnterpriseUser'", () => 
        assert.ok(!!SCIMMY.Schemas.EnterpriseUser, "Static class 'EnterpriseUser' not defined"));
    
    describe("SCIMMY.Schemas.EnterpriseUser", () => {
    });
}