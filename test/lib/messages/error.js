import assert from "assert";

export let ErrorSuite = async (SCIMMY) => {
    it("should include static class 'Error'", () => 
        assert.ok(!!SCIMMY.Messages.Error, "Static class 'Error' not defined"));
    
    describe("SCIMMY.Messages.Error", () => {
    });
}