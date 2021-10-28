import assert from "assert";

export let FilterSuite = async (SCIMMY) => {
    it("should include static class 'Filter'", () => 
        assert.ok(!!SCIMMY.Types.Filter, "Static class 'Filter' not defined"));
    
    describe("SCIMMY.Types.Filter", () => {
    });
}