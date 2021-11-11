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
            
            it("should validate 'schemas' property of 'resource' parameter if it is defined", () => {
                try {
                    // Add an empty required extension
                    TargetSchema.extend(new SCIMMY.Types.SchemaDefinition("Test", "urn:ietf:params:scim:schemas:Test"), true);
                    
                    assert.throws(() => new TargetSchema({schemas: ["a string"]}),
                        {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                            message: "The request body supplied a schema type that is incompatible with this resource"},
                        "Schema instance did not validate 'schemas' property of 'resource' parameter");
                    assert.throws(() => new TargetSchema({schemas: [TargetSchema.definition.id]}),
                        {name: "SCIMError", status: 400, scimType: "invalidValue",
                            message: "The request body is missing schema extension 'urn:ietf:params:scim:schemas:Test' required by this resource type"},
                        "Schema instance did not validate required extensions in 'schemas' property of 'resource' parameter");
                } finally {
                    // Remove the extension so it doesn't interfere later
                    TargetSchema.truncate("urn:ietf:params:scim:schemas:Test");
                }
            });
            
            it("should define getters and setters for all attributes in the schema definition", async () => {
                let {definition, constructor = {}} = await fixtures,
                    attributes = definition.attributes.map(a => a.name),
                    instance = new TargetSchema(constructor);
                
                for (let attrib of attributes) {
                    assert.ok(attrib in instance,
                        `Schema instance did not define member '${attrib}'`);
                    assert.ok(typeof Object.getOwnPropertyDescriptor(instance, attrib).get === "function",
                        `Schema instance member '${attrib}' was not defined with a 'get' method`);
                    assert.ok(typeof Object.getOwnPropertyDescriptor(instance, attrib).set === "function",
                        `Schema instance member '${attrib}' was not defined with a 'set' method`);
                }
            });
            
            it("should include lower-case attribute name property accessor aliases", async () => {
                let {constructor = {}} = await fixtures,
                    instance = new TargetSchema(constructor),
                    [key, value] = Object.entries(constructor).shift();
                
                try {
                    instance[key.toLowerCase()] = value.toUpperCase();
                    assert.strictEqual(instance[key], value.toUpperCase(),
                        "Schema instance did not include lower-case attribute aliases");
                } catch (ex) {
                    if (ex.scimType !== "mutability") throw ex;
                }
            });
            
            it("should include extension schema attribute property accessor aliases", async () => {
                try {
                    // Add an extension with one attribute
                    TargetSchema.extend(new SCIMMY.Types.SchemaDefinition("Test", "urn:ietf:params:scim:schemas:Test", "", [
                        new SCIMMY.Types.Attribute("string", "testValue")
                    ]));
                    
                    // Construct an instance to test against
                    let {constructor = {}} = await fixtures,
                        target = "urn:ietf:params:scim:schemas:Test:testValue",
                        instance = new TargetSchema(constructor);
                    
                    instance[target] = "a string";
                    assert.strictEqual(instance[target], "a string",
                        "Schema instance did not include schema extension attribute aliases");
                    instance[target.toLowerCase()] = "another string";
                    assert.strictEqual(instance[target], "another string",
                        "Schema instance did not include lower-case schema extension attribute aliases");
                } finally {
                    // Remove the extension so it doesn't interfere later
                    TargetSchema.truncate("urn:ietf:params:scim:schemas:Test");
                }
            });
            
            it("should be frozen after instantiation", async () => {
                let {constructor = {}} = await fixtures,
                    instance = new TargetSchema(constructor);
                
                assert.throws(() => instance.test = true,
                    {name: "TypeError", message: "Cannot add property test, object is not extensible"},
                    "Schema was extensible after instantiation");
                assert.throws(() => delete instance.meta,
                    {name: "TypeError", message: `Cannot delete property 'meta' of #<${instance.constructor.name}>`},
                    "Schema was not sealed after instantiation");
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
            
            it("should expect 'definition' argument to be an instance of SchemaDefinition", () => {
                assert.throws(() => SCIMMY.Schemas.declare(),
                    {name: "TypeError", message: "Registering schema definition must be of type 'SchemaDefinition'"},
                    "Static method 'declare' did not expect 'definition' parameter to be specified");
                assert.throws(() => SCIMMY.Schemas.declare({}),
                    {name: "TypeError", message: "Registering schema definition must be of type 'SchemaDefinition'"},
                    "Static method 'declare' did not expect 'definition' parameter to be an instance of SchemaDefinition");
            });
            
            it("should always return self after declaration", () => {
                assert.strictEqual(SCIMMY.Schemas.declare(SCIMMY.Schemas.User.definition), SCIMMY.Schemas,
                    "Static method 'declare' did not return Schemas for chaining");
            });
            
            it("should ignore definition instances that are already declared with the same name", () => {
                assert.doesNotThrow(() => SCIMMY.Schemas.declare(SCIMMY.Schemas.User.definition),
                    "Static method 'declare' did not ignore redeclaration of existing name/instance pair");
            });
            
            it("should expect all schema definitions to have unique names", () => {
                assert.throws(() => SCIMMY.Schemas.declare(SCIMMY.Schemas.EnterpriseUser.definition, "User"),
                    {name: "TypeError", message: `Schema definition 'User' already declared with id '${SCIMMY.Schemas.User.definition.id}'`},
                    "Static method 'declare' did not expect schema definitions to have unique names");
            });
            
            it("should not declare an existing schema definition under a new name", () => {
                assert.throws(() => SCIMMY.Schemas.declare(SCIMMY.Schemas.User.definition, "Test"),
                    {name: "TypeError", message: `Schema definition '${SCIMMY.Schemas.User.definition.id}' already declared with name 'User'`},
                    "Static method 'declare' did not prevent existing schema definition from declaring under a new name");
            });
        });
        
        describe(".declared()", () => {
            it("should have static method 'declared'", () => {
                assert.ok(typeof SCIMMY.Schemas.declared === "function",
                    "Static method 'declared' not defined");
            });
            
            it("should return all declared definitions when called without arguments", () => {
                assert.deepStrictEqual(SCIMMY.Schemas.declared(), [SCIMMY.Schemas.User.definition],
                    "Static method 'declared' did not return all declared definitions when called without arguments");
            });
            
            it("should find declaration status of definitions by name", () => {
                assert.ok(SCIMMY.Schemas.declared("User"),
                    "Static method 'declared' did not find declaration status of declared 'User' schema by name");
                assert.ok(!SCIMMY.Schemas.declared("EnterpriseUser"),
                    "Static method 'declared' did not find declaration status of undeclared 'EnterpriseUser' schema by name");
            });
            
            it("should find declaration status of definitions by ID", () => {
                assert.ok(SCIMMY.Schemas.declared(SCIMMY.Schemas.User.definition.id),
                    "Static method 'declared' did not find declaration status of declared 'User' schema by ID");
                assert.ok(!SCIMMY.Schemas.declared(SCIMMY.Schemas.EnterpriseUser.definition.id),
                    "Static method 'declared' did not find declaration status of undeclared 'EnterpriseUser' schema by ID");
            });
            
            it("should find declaration status of definitions by instance", () => {
                assert.ok(SCIMMY.Schemas.declared(SCIMMY.Schemas.User.definition),
                    "Static method 'declared' did not find declaration status of declared 'User' schema by instance");
                assert.ok(!SCIMMY.Schemas.declared(SCIMMY.Schemas.EnterpriseUser.definition),
                    "Static method 'declared' did not find declaration status of undeclared 'EnterpriseUser' schema by instance");
            });
            
            it("should find nested schema extension definition instances", () => {
                let extension = new SCIMMY.Types.SchemaDefinition("Test", "urn:ietf:params:scim:schemas:Test");
                
                try {
                    SCIMMY.Schemas.User.extend(extension);
                    assert.deepStrictEqual(SCIMMY.Schemas.declared(), [SCIMMY.Schemas.User.definition, extension],
                        "Static method 'declared' did not find nested schema extension definition instances");
                } finally {
                    SCIMMY.Schemas.User.truncate(extension.id);
                }
            });
        });
        
        ResourceTypeSuite(SCIMMY, SchemasHooks);
        ServiceProviderConfigSuite(SCIMMY, SchemasHooks);
        UserSuite(SCIMMY, SchemasHooks);
        GroupSuite(SCIMMY, SchemasHooks);
        EnterpriseUserSuite(SCIMMY, SchemasHooks);
    });
}