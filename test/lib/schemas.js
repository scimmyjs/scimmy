import assert from "assert";
import {ResourceTypeSuite} from "./schemas/resourcetype.js";
import {ServiceProviderConfigSuite} from "./schemas/spconfig.js";
import {UserSuite} from "./schemas/user.js";
import {GroupSuite} from "./schemas/group.js";
import {EnterpriseUserSuite} from "./schemas/enterpriseuser.js";

export let SchemasSuite = (SCIMMY) => {
    const SchemasHooks = {
        construct: (TargetSchema, fixtures) => (() => {
            it("should require 'resource' parameter to be an object at instantiation", () => {
                assert.throws(() => new TargetSchema(),
                    {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                    "Schema instance did not expect 'resource' parameter to be defined");
                assert.throws(() => new TargetSchema("a string"),
                    {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                    "Schema instantiation did not fail with 'resource' parameter string value 'a string'");
                assert.throws(() => new TargetSchema([]),
                    {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                    "Schema instantiation did not fail with 'resource' parameter array value");
            });
        }),
        definition: (TargetSchema, fixtures) => (() => {
            it("should have static member 'definition' that is an instance of SchemaDefinition", () => {
                assert.ok("definition" in TargetSchema,
                    "Static member 'definition' not defined");
                assert.ok(TargetSchema.definition instanceof SCIMMY.Types.SchemaDefinition,
                    "Static member 'definition' was not an instance of SchemaDefinition");
            });
            
            it("should produce definition object that matches sample schemas defined in RFC7643", async () => {
                let {definition} = await fixtures;
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(TargetSchema.definition.describe("/Schemas"))), definition,
                    "Definition did not match sample schema defined in RFC7643");
            });
        })
    };
    
    it("should include static class 'Schemas'", () => 
        assert.ok(!!SCIMMY.Schemas, "Static class 'Schemas' not defined"));
    
    describe("SCIMMY.Schemas", () => {
        describe(".declare()", () => {
            it("should have static method 'declare'", () => {
                assert.ok(typeof SCIMMY.Schemas.declare === "function",
                    "Static method 'declare' not defined");
            });
        });
        
        describe(".declared()", () => {
            it("should have static method 'declared'", () => {
                assert.ok(typeof SCIMMY.Schemas.declared === "function",
                    "Static method 'declared' not defined");
            });
        });
    
        ResourceTypeSuite(SCIMMY, SchemasHooks);
        ServiceProviderConfigSuite(SCIMMY, SchemasHooks);
        UserSuite(SCIMMY, SchemasHooks);
        GroupSuite(SCIMMY, SchemasHooks);
        EnterpriseUserSuite(SCIMMY, SchemasHooks);
    });
}