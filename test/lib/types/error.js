import assert from "assert";
import {SCIMError} from "#@/lib/types/error.js";

describe("SCIMMY.Types.Error", () => {
    it("should extend native 'Error' class", () => {
        assert.ok(new SCIMError() instanceof Error,
            "Error type class did not extend native 'Error' class");
    });
    
    describe("@constructor", () => {
        it("should not require arguments", () => {
            assert.doesNotThrow(() => new SCIMError(),
                "Error type class did not instantiate without arguments");
        });
    });
    
    describe("#name", () => {
        it("should be defined", () => {
            assert.ok("name" in new SCIMError(),
                "Instance member 'name' was not defined");
        });
        
        it("should have value 'SCIMError'", () => {
            assert.strictEqual((new SCIMError())?.name, "SCIMError",
                "Instance member 'name' did not have value 'SCIMError'");
        });
    });
    
    describe("#status", () => {
        it("should be defined", () => {
            assert.ok("status" in new SCIMError(),
                "Instance member 'status' was not defined");
        });
    });
    
    describe("#scimType", () => {
        it("should be defined", () => {
            assert.ok("scimType" in new SCIMError(),
                "Instance member 'scimType' was not defined");
        });
    });
    
    describe("#message", () => {
        it("should be defined", () => {
            assert.ok("message" in new SCIMError(),
                "Instance member 'message' was not defined");
        });
    });
});