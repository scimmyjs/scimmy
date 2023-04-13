import assert from "assert";
import {SCIMError} from "#@/lib/types/error.js";

describe("SCIMMY.Types.Error", () => {
    it("should not require arguments at instantiation", () => {
        assert.doesNotThrow(() => new SCIMError(),
            "Error type class did not instantiate without arguments");
    });
    
    it("should extend native 'Error' class", () => {
        assert.ok(new SCIMError() instanceof Error,
            "Error type class did not extend native 'Error' class");
    });
    
    it("should have instance member 'name' with value 'SCIMError'", () => {
        assert.strictEqual((new SCIMError())?.name, "SCIMError",
            "Error type class did not include instance member 'name' with value 'SCIMError'");
    });
    
    it("should have instance member 'status'", () => {
        assert.ok("status" in (new SCIMError()),
            "Error type class did not include instance member 'status'");
    });
    
    it("should have instance member 'scimType'", () => {
        assert.ok("scimType" in (new SCIMError()),
            "Error type class did not include instance member 'scimType'");
    });
    
    it("should have instance member 'message'", () => {
        assert.ok("message" in (new SCIMError()),
            "Error type class did not include instance member 'message'");
    });
});