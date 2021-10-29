import assert from "assert";
import {SchemaSuite} from "./resources/schema.js";
import {ResourceTypeSuite} from "./resources/resourcetype.js";
import {ServiceProviderConfigSuite} from "./resources/spconfig.js";
import {UserSuite} from "./resources/user.js";
import {GroupSuite} from "./resources/group.js";

export let ResourcesSuite = (SCIMMY) => {
    it("should include static class 'Resources'", () => 
        assert.ok(!!SCIMMY.Resources, "Static class 'Resources' not defined"));
    
    describe("SCIMMY.Resources", () => {
        describe(".declare()", () => {
            it("should have static method 'declare'", () => 
                assert.ok(typeof SCIMMY.Resources.declare === "function", "Static method 'declare' not defined"));
        });
        
        describe(".declared()", () => {
            it("should have static method 'declared'", () =>
                assert.ok(typeof SCIMMY.Resources.declared === "function", "Static method 'declared' not defined"));
        });
        
        SchemaSuite(SCIMMY);
        ResourceTypeSuite(SCIMMY);
        ServiceProviderConfigSuite(SCIMMY);
        UserSuite(SCIMMY);
        GroupSuite(SCIMMY);
    });
}