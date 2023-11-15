import assert from "assert";
import {SchemaDefinition} from "#@/lib/types/definition.js";
import Schemas from "#@/lib/schemas.js";

describe("SCIMMY.Schemas", () => {
    it("should include static class 'ResourceType'", () => {
        assert.ok(!!Schemas.ResourceType,
            "Static class 'ResourceType' not defined");
    });
    
    it("should include static class 'ServiceProviderConfig'", () => {
        assert.ok(!!Schemas.ServiceProviderConfig,
            "Static class 'ServiceProviderConfig' not defined");
    });
    
    it("should include static class 'User'", () => {
        assert.ok(!!Schemas.User,
            "Static class 'User' not defined");
    });
    
    it("should include static class 'Group'", () => {
        assert.ok(!!Schemas.Group,
            "Static class 'Group' not defined");
    });
    
    it("should include static class 'EnterpriseUser'", () => {
        assert.ok(!!Schemas.EnterpriseUser,
            "Static class 'EnterpriseUser' not defined");
    });
    
    describe(".declare()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Schemas.declare === "function",
                "Static method 'declare' not defined");
        });
        
        it("should expect 'definition' argument to be an instance of SchemaDefinition", () => {
            assert.throws(() => Schemas.declare(),
                {name: "TypeError", message: "Registering schema definition must be of type 'SchemaDefinition'"},
                "Static method 'declare' did not expect 'definition' parameter to be specified");
            assert.throws(() => Schemas.declare({}),
                {name: "TypeError", message: "Registering schema definition must be of type 'SchemaDefinition'"},
                "Static method 'declare' did not expect 'definition' parameter to be an instance of SchemaDefinition");
        });
        
        it("should always return self after declaration", () => {
            assert.strictEqual(Schemas.declare(Schemas.User.definition), Schemas,
                "Static method 'declare' did not return Schemas for chaining");
        });
        
        it("should ignore definition instances that are already declared with the same name", () => {
            assert.doesNotThrow(() => Schemas.declare(Schemas.User.definition),
                "Static method 'declare' did not ignore redeclaration of existing name/instance pair");
        });
        
        it("should expect all schema definitions to have unique names", () => {
            assert.throws(() => Schemas.declare(Schemas.EnterpriseUser.definition, "User"),
                {name: "TypeError", message: `Schema definition 'User' already declared with id '${Schemas.User.definition.id}'`},
                "Static method 'declare' did not expect schema definitions to have unique names");
        });
        
        it("should not declare an existing schema definition under a new name", () => {
            assert.throws(() => Schemas.declare(Schemas.User.definition, "Test"),
                {name: "TypeError", message: `Schema definition '${Schemas.User.definition.id}' already declared with name 'User'`},
                "Static method 'declare' did not prevent existing schema definition from declaring under a new name");
        });
    });
    
    describe(".declared()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Schemas.declared === "function",
                "Static method 'declared' not defined");
        });
        
        it("should return all declared definitions when called without arguments", () => {
            assert.deepStrictEqual(Schemas.declared(), [Schemas.User.definition],
                "Static method 'declared' did not return all declared definitions when called without arguments");
        });
        
        it("should return boolean 'false' when called with unexpected arguments", () => {
            assert.strictEqual(Schemas.declared({}), false,
                "Static method 'declared' did not return boolean 'false' when called with unexpected arguments");
        });
        
        it("should find declaration status of definitions by name", () => {
            assert.ok(Schemas.declared("User"),
                "Static method 'declared' did not find declaration status of declared 'User' schema by name");
            assert.ok(!Schemas.declared("EnterpriseUser"),
                "Static method 'declared' did not find declaration status of undeclared 'EnterpriseUser' schema by name");
        });
        
        it("should find declaration status of definitions by ID", () => {
            assert.ok(Schemas.declared(Schemas.User.definition.id),
                "Static method 'declared' did not find declaration status of declared 'User' schema by ID");
            assert.ok(!Schemas.declared(Schemas.EnterpriseUser.definition.id),
                "Static method 'declared' did not find declaration status of undeclared 'EnterpriseUser' schema by ID");
        });
        
        it("should find declaration status of definitions by instance", () => {
            assert.ok(Schemas.declared(Schemas.User.definition),
                "Static method 'declared' did not find declaration status of declared 'User' schema by instance");
            assert.ok(!Schemas.declared(Schemas.EnterpriseUser.definition),
                "Static method 'declared' did not find declaration status of undeclared 'EnterpriseUser' schema by instance");
        });
        
        it("should find nested schema extension definition instances", () => {
            const extension = new SchemaDefinition("Test", "urn:ietf:params:scim:schemas:Test");
            
            try {
                Schemas.User.extend(extension);
                assert.deepStrictEqual(Schemas.declared(), [Schemas.User.definition, extension],
                    "Static method 'declared' did not find nested schema extension definition instances");
            } finally {
                Schemas.User.truncate(extension.id);
            }
        });
    });
});