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
            it("should have static method 'declare'", () => {
                assert.ok(typeof SCIMMY.Resources.declare === "function",
                    "Static method 'declare' not defined");
            });
            
            it("should expect 'resource' argument to be an instance of Resource", () => {
                assert.throws(() => SCIMMY.Resources.declare(),
                    {name: "TypeError", message: "Registering resource must be of type 'Resource'"},
                    "Static method 'declare' did not expect 'resource' parameter to be specified");
                assert.throws(() => SCIMMY.Resources.declare({}),
                    {name: "TypeError", message: "Registering resource must be of type 'Resource'"},
                    "Static method 'declare' did not expect 'resource' parameter to be an instance of Resource");
            });
            
            it("should expect 'config' argument to be either a string or an object", () => {
                assert.throws(() => SCIMMY.Resources.declare(SCIMMY.Resources.User, false),
                    {name: "TypeError", message: "Resource declaration expected 'config' parameter to be either a name string or configuration object"},
                    "Static method 'declare' did not fail with 'config' parameter boolean value 'false'");
                assert.throws(() => SCIMMY.Resources.declare(SCIMMY.Resources.User, []),
                    {name: "TypeError", message: "Resource declaration expected 'config' parameter to be either a name string or configuration object"},
                    "Static method 'declare' did not fail with 'config' parameter array value");
                assert.throws(() => SCIMMY.Resources.declare(SCIMMY.Resources.User, 1),
                    {name: "TypeError", message: "Resource declaration expected 'config' parameter to be either a name string or configuration object"},
                    "Static method 'declare' did not fail with 'config' parameter number value '1'");
            });
            
            it("should refuse to declare internal resource implementations 'Schema', 'ResourceType', and 'ServiceProviderConfig'", () => {
                assert.throws(() => SCIMMY.Resources.declare(SCIMMY.Resources.Schema),
                    {name: "TypeError", message: "Refusing to declare internal resource implementation 'Schema'"},
                    "Static method 'declare' did not refuse to declare internal resource implementation 'Schema'");
                assert.throws(() => SCIMMY.Resources.declare(SCIMMY.Resources.ResourceType),
                    {name: "TypeError", message: "Refusing to declare internal resource implementation 'ResourceType'"},
                    "Static method 'declare' did not refuse to declare internal resource implementation 'ResourceType'");
                assert.throws(() => SCIMMY.Resources.declare(SCIMMY.Resources.ServiceProviderConfig),
                    {name: "TypeError", message: "Refusing to declare internal resource implementation 'ServiceProviderConfig'"},
                    "Static method 'declare' did not refuse to declare internal resource implementation 'ServiceProviderConfig'");
            });
            
            it("should return self after declaration if 'config' argument was an object", () => {
                assert.strictEqual(SCIMMY.Resources.declare(SCIMMY.Resources.User, {}), SCIMMY.Resources,
                    "Static method 'declare' did not return Resources for chaining");
            });
            
            it("should return resource after declaration if 'config' argument was not an object", () => {
                assert.strictEqual(SCIMMY.Resources.declare(SCIMMY.Resources.Group), SCIMMY.Resources.Group,
                    "Static method 'declare' did not return declared resource for chaining");
            });
            
            it("should expect all resources to have unique names", () => {
                assert.throws(() => SCIMMY.Resources.declare(SCIMMY.Resources.Group, "User"),
                    {name: "TypeError", message: "Resource 'User' already declared"},
                    "Static method 'declare' did not expect resources to have unique names");
            });
            
            it("should not declare an existing resource under a new name", () => {
                assert.throws(() => SCIMMY.Resources.declare(SCIMMY.Resources.Group, "Test"),
                    {name: "TypeError", message: `Resource 'Test' already declared with name 'Group'`},
                    "Static method 'declare' did not prevent existing resource from declaring under a new name");
            });
            
            it("should declare resource type implementation's schema definition to SCIMMY.Schemas", () => {
                for (let schema of Object.values(SCIMMY.Resources.declared()).map(r => r.schema.definition)) {
                    assert.ok(SCIMMY.Schemas.declared(schema),
                        "Static method 'declare' did not declare resource type implementation's schema definition");
                }
            });
        });
        
        describe(".declared()", () => {
            it("should have static method 'declared'", () => {
                assert.ok(typeof SCIMMY.Resources.declared === "function",
                    "Static method 'declared' not defined");
            });
            
            it("should return all declared resources when called without arguments", () => {
                assert.deepStrictEqual(SCIMMY.Resources.declared(), {User: SCIMMY.Resources.User, Group: SCIMMY.Resources.Group},
                    "Static method 'declared' did not return all declared resources when called without arguments");
            });
            
            it("should find declared resource by name when 'config' argument is a string", () => {
                assert.deepStrictEqual(SCIMMY.Resources.declared("User"), SCIMMY.Resources.User,
                    "Static method 'declared' did not find declared resource 'User' when called with 'config' string value 'User'");
            });
            
            it("should find declaration status of resource when 'config' argument is a resource instance", () => {
                assert.ok(SCIMMY.Resources.declared(SCIMMY.Resources.User),
                    "Static method 'declared' did not find declaration status of declared 'User' resource by instance");
                assert.ok(!SCIMMY.Resources.declared(SCIMMY.Resources.ResourceType),
                    "Static method 'declared' did not find declaration status of undeclared 'ResourceType' resource by instance");
            });
        });
        
        SchemaSuite(SCIMMY);
        ResourceTypeSuite(SCIMMY);
        ServiceProviderConfigSuite(SCIMMY);
        UserSuite(SCIMMY);
        GroupSuite(SCIMMY);
    });
}