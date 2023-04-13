import assert from "assert";
import SCIMMY from "#@/scimmy.js";

describe("SCIMMY", () => {
    it("should include static class 'Config'", () => {
        assert.ok(!!SCIMMY.Config,
            "Static class 'Config' not defined");
    });
    
    it("should include static class 'Types'", () => {
        assert.ok(!!SCIMMY.Types,
            "Static class 'Types' not defined");
    });
    
    it("should include static class 'Messages'", () => {
        assert.ok(!!SCIMMY.Messages,
            "Static class 'Messages' not defined");
    });
    
    it("should include static class 'Schemas'", () => {
        assert.ok(!!SCIMMY.Schemas,
            "Static class 'Schemas' not defined");
    });
    
    it("should include static class 'Resources'", () => {
        assert.ok(!!SCIMMY.Resources,
            "Static class 'Resources' not defined");
    });
});