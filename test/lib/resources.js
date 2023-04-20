import assert from "assert";
import sinon from "sinon";
import * as Schemas from "#@/lib/schemas.js";
import Resources from "#@/lib/resources.js";
import {createResourceClass} from "../hooks/resources.js";

describe("SCIMMY.Resources", () => {
    const sandbox = sinon.createSandbox();
    
    class Test extends createResourceClass("Test", "urn:ietf:params:scim:schemas:Test") {
        static ingress = sandbox.stub();
        static egress = sandbox.stub();
        static degress = sandbox.stub();
        static basepath = sandbox.stub();
        static extend = sandbox.stub();
    }
    
    it("should include static class 'Schema'", () => {
        assert.ok(!!Resources.Schema,
            "Static class 'Schema' not defined");
    });
    
    it("should include static class 'ResourceType'", () => {
        assert.ok(!!Resources.ResourceType,
            "Static class 'ResourceType' not defined");
    });
    
    it("should include static class 'ServiceProviderConfig'", () => {
        assert.ok(!!Resources.ServiceProviderConfig,
            "Static class 'ServiceProviderConfig' not defined");
    });
    
    it("should include static class 'User'", () => {
        assert.ok(!!Resources.User,
            "Static class 'User' not defined");
    });
    
    it("should include static class 'Group'", () => {
        assert.ok(!!Resources.Group,
            "Static class 'Group' not defined");
    });
    
    after(() => sandbox.restore());
    before(() => sandbox.stub(Schemas.default, "declare"));
    
    describe(".declare()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Resources.declare === "function",
                "Static method 'declare' was not implemented");
        });
        
        it("should expect 'resource' argument to be an instance of Resource", () => {
            assert.throws(() => Resources.declare(),
                {name: "TypeError", message: "Registering resource must be of type 'Resource'"},
                "Static method 'declare' did not expect 'resource' parameter to be specified");
            assert.throws(() => Resources.declare({}),
                {name: "TypeError", message: "Registering resource must be of type 'Resource'"},
                "Static method 'declare' did not expect 'resource' parameter to be an instance of Resource");
        });
        
        it("should expect 'config' argument to be either a string or an object", () => {
            assert.throws(() => Resources.declare(Resources.User, false),
                {name: "TypeError", message: "Resource declaration expected 'config' parameter to be either a name string or configuration object"},
                "Static method 'declare' did not fail with 'config' parameter boolean value 'false'");
            assert.throws(() => Resources.declare(Resources.User, []),
                {name: "TypeError", message: "Resource declaration expected 'config' parameter to be either a name string or configuration object"},
                "Static method 'declare' did not fail with 'config' parameter array value");
            assert.throws(() => Resources.declare(Resources.User, 1),
                {name: "TypeError", message: "Resource declaration expected 'config' parameter to be either a name string or configuration object"},
                "Static method 'declare' did not fail with 'config' parameter number value '1'");
        });
        
        it("should refuse to declare internal resource implementations 'Schema', 'ResourceType', and 'ServiceProviderConfig'", () => {
            assert.throws(() => Resources.declare(Resources.Schema),
                {name: "TypeError", message: "Refusing to declare internal resource implementation 'Schema'"},
                "Static method 'declare' did not refuse to declare internal resource implementation 'Schema'");
            assert.throws(() => Resources.declare(Resources.ResourceType),
                {name: "TypeError", message: "Refusing to declare internal resource implementation 'ResourceType'"},
                "Static method 'declare' did not refuse to declare internal resource implementation 'ResourceType'");
            assert.throws(() => Resources.declare(Resources.ServiceProviderConfig),
                {name: "TypeError", message: "Refusing to declare internal resource implementation 'ServiceProviderConfig'"},
                "Static method 'declare' did not refuse to declare internal resource implementation 'ServiceProviderConfig'");
        });
        
        it("should return self after declaration if 'config' argument was an object", () => {
            assert.strictEqual(Resources.declare(Resources.User, {}), Resources,
                "Static method 'declare' did not return Resources for chaining");
        });
        
        it("should return resource after declaration if 'config' argument was not an object", () => {
            assert.strictEqual(Resources.declare(Resources.Group), Resources.Group,
                "Static method 'declare' did not return declared resource for chaining");
        });
        
        it("should expect all resources to have unique names", () => {
            assert.throws(() => Resources.declare(Resources.Group, "User"),
                {name: "TypeError", message: "Resource 'User' already declared"},
                "Static method 'declare' did not expect resources to have unique names");
        });
        
        it("should not declare an existing resource under a new name", () => {
            assert.throws(() => Resources.declare(Resources.Group, "Test"),
                {name: "TypeError", message: `Resource 'Test' already declared with name 'Group'`},
                "Static method 'declare' did not prevent existing resource from declaring under a new name");
        });
        
        it("should declare resource type implementation's schema definition to Schemas", () => {
            for (let resource of [Resources.User, Resources.Group]) {
                assert.ok(Schemas.default.declare.calledWith(resource.schema.definition),
                    "Static method 'declare' did not declare resource type implementation's schema definition");
            }
        });
        
        const properties = [
            ["ingress"],
            ["egress"],
            ["degress"],
            ["basepath", "/scim", "a string"],
            ["extensions", [{}], "an array", "extend"]
        ];
        
        for (let [prop, val = (() => {}), kind = "a function", fn = prop] of properties) {
            it(`should call resource's '${fn}' static method if '${prop}' property of 'config' argument is ${kind}`, function () {
                try {
                    Resources.declare(Test, {[prop]: val});
                } catch {
                    this.skip();
                }
                
                assert.ok(Test[fn].calledOnce,
                    `Static method 'declare' did not call resource's '${fn}' static method when '${prop}' property of 'config' argument was ${kind}`);
            });
        }
    });
    
    describe(".declared()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Resources.declared === "function",
                "Static method 'declared' was not implemented");
        });
        
        it("should return all declared resources when called without arguments", () => {
            assert.deepStrictEqual(Resources.declared(), {Test, User: Resources.User, Group: Resources.Group},
                "Static method 'declared' did not return all declared resources when called without arguments");
        });
        
        it("should return boolean 'false' when called with unexpected arguments", () => {
            assert.strictEqual(Resources.declared({}), false,
                "Static method 'declared' did not return boolean 'false' when called with unexpected arguments");
        });
        
        it("should find declared resource by name when 'resource' argument is a string", () => {
            assert.deepStrictEqual(Resources.declared("User"), Resources.User,
                "Static method 'declared' did not find declared resource 'User' when called with 'resource' string value 'User'");
        });
        
        it("should find declaration status of resource when 'resource' argument is a resource instance", () => {
            assert.ok(Resources.declared(Resources.User),
                "Static method 'declared' did not find declaration status of declared 'User' resource by instance");
            assert.ok(!Resources.declared(Resources.ResourceType),
                "Static method 'declared' did not find declaration status of undeclared 'ResourceType' resource by instance");
        });
    });
});