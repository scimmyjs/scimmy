import assert from "assert";
import {SchemaSuite} from "./resources/schema.js";
import {ResourceTypeSuite} from "./resources/resourcetype.js";
import {ServiceProviderConfigSuite} from "./resources/spconfig.js";
import {UserSuite} from "./resources/user.js";
import {GroupSuite} from "./resources/group.js";

export let ResourcesSuite = (SCIMMY) => {
    const ResourcesHooks = {
        endpoint: (TargetResource) => (() => {
            assert.ok(Object.getOwnPropertyNames(TargetResource).includes("endpoint"),
                "Resource did not implement static member 'endpoint'");
            assert.ok(typeof TargetResource.endpoint === "string",
                "Static member 'endpoint' was not a string");
        }),
        schema: (TargetResource, implemented = true) => (() => {
            if (implemented) {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("schema"),
                    "Resource did not implement static member 'schema'");
                assert.ok(TargetResource.schema.prototype instanceof SCIMMY.Types.Schema,
                    "Static member 'schema' was not a Schema");
            } else {
                assert.ok(!Object.getOwnPropertyNames(TargetResource).includes("schema"),
                    "Static member 'schema' unexpectedly implemented by resource");
            }
        }),
        extensions: (TargetResource, implemented = true) => (() => {
            if (implemented) {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("extensions"),
                    "Resource did not implement static member 'extensions'");
                assert.ok(Array.isArray(TargetResource.extensions),
                    "Static member 'extensions' was not an array");
            } else {
                assert.ok(!Object.getOwnPropertyNames(TargetResource).includes("extensions"),
                    "Static member 'extensions' unexpectedly implemented by resource");
            }
        }),
        extend: (TargetResource, overrides = false) => (() => {
            if (!overrides) {
                assert.ok(!Object.getOwnPropertyNames(TargetResource).includes("extend"),
                    "Static method 'extend' unexpectedly overridden by resource");
            } else {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("extend"),
                    "Resource did not override static method 'extend'");
                assert.ok(typeof TargetResource.extend === "function",
                    "Static method 'extend' was not a function");
                assert.throws(() => TargetResource.extend(),
                    {name: "TypeError", message: `SCIM '${TargetResource.name}' resource does not support extension`},
                    "Static method 'extend' did not throw failure");
            }
        }),
        ingress: (TargetResource, fixtures) => (() => {
            if (fixtures) {
                let handler = async (res, instance) => {
                    let {egress} = await fixtures,
                        target = Object.assign((!!res.id ? egress.find(f => f.id === res.id) : {id: "5"}), instance);
                    
                    if (!egress.includes(target)) egress.push(target);
                    return target;
                };
                
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("ingress"),
                    "Resource did not implement static method 'ingress'");
                assert.ok(typeof TargetResource.ingress === "function",
                    "Static method 'ingress' was not a function");
                assert.strictEqual(TargetResource.ingress(handler), TargetResource,
                    "Static method 'ingress' did not correctly set ingress handler");
            } else {
                assert.throws(() => TargetResource.ingress(),
                    {name: "TypeError", message: `Method 'ingress' not implemented by resource '${TargetResource.name}'`},
                    "Static method 'ingress' unexpectedly implemented by resource");
            }
        }),
        egress: (TargetResource, fixtures) => (() => {
            if (fixtures) {
                let handler = async (res) => {
                    let {egress} = await fixtures;
                    
                    return (!!res.id ? egress.find(f => f.id === res.id) : egress);
                };
                
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("egress"),
                    "Resource did not implement static method 'egress'");
                assert.ok(typeof TargetResource.egress === "function",
                    "Static method 'egress' was not a function");
                assert.strictEqual(TargetResource.egress(handler), TargetResource,
                    "Static method 'egress' did not correctly set egress handler");
            } else {
                assert.throws(() => TargetResource.egress(),
                    {name: "TypeError", message: `Method 'egress' not implemented by resource '${TargetResource.name}'`},
                    "Static method 'egress' unexpectedly implemented by resource");
            }
        }),
        degress: (TargetResource, fixtures) => (() => {
            if (fixtures) {
                let handler = async (res) => {
                    let {egress} = await fixtures,
                        index = egress.indexOf(egress.find(f => f.id === res.id));
                    
                    if (index < 0) throw new SCIMMY.Types.Error(404, null, `Resource ${res.id} not found`);
                    else egress.splice(index, 1);
                };
                
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("degress"),
                    "Resource did not implement static method 'degress'");
                assert.ok(typeof TargetResource.degress === "function",
                    "Static method 'degress' was not a function");
                assert.strictEqual(TargetResource.degress(handler), TargetResource,
                    "Static method 'degress' did not correctly set degress handler");
            } else {
                assert.throws(() => TargetResource.degress(),
                    {name: "TypeError", message: `Method 'degress' not implemented by resource '${TargetResource.name}'`},
                    "Static method 'degress' unexpectedly implemented by resource");
            }
        }),
        basepath: (TargetResource) => (() => {
            it("should implement static method 'basepath'", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("basepath"),
                    "Static method 'basepath' was not implemented by resource");
                assert.ok(typeof TargetResource.basepath === "function",
                    "Static method 'basepath' was not a function");
            });
            
            it("should only set basepath once, and do nothing if basepath has already been set", () => {
                let existing = TargetResource.basepath(),
                    expected = `/scim${TargetResource.endpoint}`;
                
                TargetResource.basepath("/scim");
                assert.ok(TargetResource.basepath() === (existing ?? expected),
                    "Static method 'basepath' did not set or ignore resource basepath");
                
                TargetResource.basepath("/test");
                assert.ok(TargetResource.basepath() === (existing ?? expected),
                    "Static method 'basepath' did not do nothing when basepath was already set");
            });
        }),
        construct: (TargetResource, filterable = true) => (() => {
            if (filterable) {
                // TODO: tests for when the resource isn't an internal one
            } else {
                it("should not instantiate when a filter has been specified", () => {
                    assert.throws(() => new TargetResource({filter: "id pr"}),
                        {name: "SCIMError", status: 403, scimType: null,
                            message: `${TargetResource.name} does not support retrieval by filter`},
                        "Internal resource instantiated when filter was specified");
                });
            }
        }),
        read: (TargetResource, fixtures, listable = true) => (() => {
            it("should implement instance method 'read'", () => {
                assert.ok("read" in (new TargetResource()),
                    "Resource did not implement instance method 'read'");
                assert.ok(typeof (new TargetResource()).read === "function",
                    "Instance method 'read' was not a function");
            });
            
            if (listable) {
                it("should return a ListResponse if resource was instantiated without an ID", async () => {
                    let {egress: expected} = await fixtures,
                        result = await (new TargetResource()).read(),
                        resources = result?.Resources.map(r => JSON.parse(JSON.stringify({
                            ...r, schemas: undefined, meta: undefined, attributes: undefined
                        })));
                    
                    assert.ok(result instanceof SCIMMY.Messages.ListResponse,
                        "Instance method 'read' did not return a ListResponse when resource instantiated without an ID");
                    assert.deepStrictEqual(resources, expected,
                        "Instance method 'read' did not return a ListResponse containing all resources from fixture");
                });
            } else {
                it("should return the requested resource without sugar-coating", async () => {
                    let {egress: expected} = await fixtures,
                        result = await (new TargetResource()).read(),
                        actual = JSON.parse(JSON.stringify({...result, schemas: undefined, meta: undefined}));
                    
                    assert.deepStrictEqual(actual, expected,
                        "Instance method 'read' did not return the requested resource without sugar-coating");
                });
            }
        }),
        write: (TargetResource, fixtures) => (() => {
            if (fixtures) {
                it("should implement instance method 'write'", () => {
                    assert.ok("write" in (new TargetResource()),
                        "Resource did not implement instance method 'write'");
                    assert.ok(typeof (new TargetResource()).write === "function",
                        "Instance method 'write' was not a function");
                });
            } else {
                assert.throws(() => new TargetResource().write(),
                    {name: "TypeError", message: `Method 'write' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'write' unexpectedly implemented by resource");
            }
        }),
        patch: (TargetResource, fixtures) => (() => {
            if (fixtures) {
                it("should implement instance method 'patch'", () => {
                    assert.ok("patch" in (new TargetResource()),
                        "Resource did not implement instance method 'patch'");
                    assert.ok(typeof (new TargetResource()).patch === "function",
                        "Instance method 'patch' was not a function");
                });
            } else {
                assert.throws(() => new TargetResource().patch(),
                    {name: "TypeError", message: `Method 'patch' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'patch' unexpectedly implemented by resource");
            }
        }),
        dispose: (TargetResource, fixtures) => (() => {
            if (fixtures) {
                it("should implement instance method 'dispose'", () => {
                    assert.ok("dispose" in (new TargetResource()),
                        "Resource did not implement instance method 'dispose'");
                    assert.ok(typeof (new TargetResource()).dispose === "function",
                        "Instance method 'dispose' was not a function");
                });
                
                it("should expect resource instances to have 'id' property", async () => {
                    await assert.rejects(() => new TargetResource().dispose(),
                        {name: "SCIMError", status: 404, scimType: null, message: "Resource undefined not found"},
                        "Instance method 'dispose' did not expect resource instance to have 'id' property");
                });
            } else {
                assert.throws(() => new TargetResource().dispose(),
                    {name: "TypeError", message: `Method 'dispose' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'dispose' unexpectedly implemented by resource");
            }
        })
    };
    
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
        
        SchemaSuite(SCIMMY, ResourcesHooks);
        ResourceTypeSuite(SCIMMY, ResourcesHooks);
        ServiceProviderConfigSuite(SCIMMY, ResourcesHooks);
        UserSuite(SCIMMY, ResourcesHooks);
        GroupSuite(SCIMMY, ResourcesHooks);
    });
}