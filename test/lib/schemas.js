import assert from "assert";
import {ResourceTypeSuite} from "./schemas/resourcetype.js";
import {ServiceProviderConfigSuite} from "./schemas/spconfig.js";
import {UserSuite} from "./schemas/user.js";
import {GroupSuite} from "./schemas/group.js";
import {EnterpriseUserSuite} from "./schemas/enterpriseuser.js";

export let SchemasSuite = (SCIMMY) => {
    it("should include static class 'Schemas'", () => 
        assert.ok(!!SCIMMY.Schemas, "Static class 'Schemas' not defined"));
    
    describe("SCIMMY.Schemas", () => {
        describe(".declare()", () => {
            it("should have static method 'declare'", () =>
                assert.ok(typeof SCIMMY.Schemas.declare === "function", "Static method 'declare' not defined"));
        });
        
        describe(".declared()", () => {
            it("should have static method 'declared'", () =>
                assert.ok(typeof SCIMMY.Schemas.declared === "function", "Static method 'declared' not defined"));
        });
    
        ResourceTypeSuite(SCIMMY);
        ServiceProviderConfigSuite(SCIMMY);
        UserSuite(SCIMMY);
        GroupSuite(SCIMMY);
        EnterpriseUserSuite(SCIMMY);
    });
}