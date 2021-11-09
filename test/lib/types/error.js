import assert from "assert";

export let ErrorSuite = (SCIMMY) => {
    it("should include static class 'Error'", () => 
        assert.ok(!!SCIMMY.Types.Error, "Static class 'Error' not defined"));
    
    describe("SCIMMY.Types.Error", () => {
        it("should not require arguments at instantiation", () => {
            try {
                new SCIMMY.Types.Error();
            } catch {
                assert.fail("Error type class did not instantiate without arguments");
            }
        });
        
        it("should extend native 'Error' class", () => {
            assert.ok(new SCIMMY.Types.Error() instanceof Error,
                "Error type class did not extend native 'Error' class");
        });
        
        it("should have instance member 'name' with value 'SCIMError'", () => {
            assert.strictEqual((new SCIMMY.Types.Error())?.name, "SCIMError",
                "Error type class did not include instance member 'name' with value 'SCIMError'");
        });
        
        it("should have instance member 'status'", () => {
            assert.ok("status" in (new SCIMMY.Types.Error()),
                "Error type class did not include instance member 'status'");
        });
        
        it("should have instance member 'scimType'", () => {
            assert.ok("scimType" in (new SCIMMY.Types.Error()),
                "Error type class did not include instance member 'scimType'");
        });
        
        it("should have instance member 'message'", () => {
            assert.ok("message" in (new SCIMMY.Types.Error()),
                "Error type class did not include instance member 'message'");
        });
    });
}