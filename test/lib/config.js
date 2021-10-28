import assert from "assert";

export let ConfigSuite = (SCIMMY) => {
    it("should include static class 'Config'", () => 
        assert.ok(!!SCIMMY.Config, "Static class 'Config' not defined"));
    
    describe("SCIMMY.Config", () => {
        describe(".get", () => {
            it("should have static method 'get'", () => 
                assert.ok(typeof SCIMMY.Config.get === "function", "Static method 'get' not defined"));
        });
        
        describe(".set", () => {
            it("should have static method 'set'", () => 
                assert.ok(typeof SCIMMY.Config.set === "function", "Static method 'set' not defined"));
        });
    });
}