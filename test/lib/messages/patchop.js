import assert from "assert";

export let PatchOpSuite = async (SCIMMY) => {
    it("should include static class 'PatchOp'", () => 
        assert.ok(!!SCIMMY.Messages.PatchOp, "Static class 'PatchOp' not defined"));
    
    describe("SCIMMY.Messages.PatchOp", () => {
    });
}