import assert from "assert";

export let ServiceProviderConfigSuite = async (SCIMMY) => {
    it("should include static class 'ServiceProviderConfig'", () => 
        assert.ok(!!SCIMMY.Resources.ServiceProviderConfig, "Static class 'ServiceProviderConfig' not defined"));
    
    describe("SCIMMY.Resources.ServiceProviderConfig", () => {
    });
}