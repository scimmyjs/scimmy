import assert from "assert";

export let ListResponseSuite = async (SCIMMY) => {
    it("should include static class 'ListResponse'", () => 
        assert.ok(!!SCIMMY.Messages.ListResponse, "Static class 'ListResponse' not defined"));
    
    describe("SCIMMY.Messages.ListResponse", () => {
    });
}