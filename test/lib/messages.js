import assert from "assert";
import Messages from "#@/lib/messages.js";

describe("SCIMMY.Messages", () => {
    it("should include static class 'Error'", () => {
        assert.ok(!!Messages.Error,
            "Static class 'Error' not defined");
    });
    
    it("should include static class 'ListResponse'", () => {
        assert.ok(!!Messages.ListResponse,
            "Static class 'ListResponse' not defined");
    });
    
    it("should include static class 'PatchOp'", () => {
        assert.ok(!!Messages.PatchOp,
            "Static class 'PatchOp' not defined");
    });
    
    it("should include static class 'BulkRequest'", () => {
        assert.ok(!!Messages.BulkRequest,
            "Static class 'BulkRequest' not defined");
    });
    
    it("should include static class 'BulkResponse'", () => {
        assert.ok(!!Messages.BulkResponse,
            "Static class 'BulkResponse' not defined");
    });
    
    it("should include static class 'SearchRequest'", () => {
        assert.ok(!!Messages.SearchRequest,
            "Static class 'SearchRequest' not defined");
    });
});