import assert from "assert";
import sinon from "sinon";
import * as Schemas from "#@/lib/schemas.js";
import {SCIMError} from "#@/lib/types/error.js";
import SCIMMY from "#@/scimmy.js";
import Resources from "#@/lib/resources.js";
import {createResourceClass} from "./types/resource.js";

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
                "Static method 'declare' not defined");
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
                assert.ok(SCIMMY.Schemas.declare.calledWith(resource.schema.definition),
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
                "Static method 'declared' not defined");
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

export const ResourcesHooks = {
    endpoint: (TargetResource) => (() => {
        it("should be implemented", () => {
            assert.ok(Object.getOwnPropertyNames(TargetResource).includes("endpoint"),
                "Resource did not implement static member 'endpoint'");
        });
        
        it("should be a string", () => {
            assert.ok(typeof TargetResource.endpoint === "string",
                "Static member 'endpoint' was not a string");
        });
    }),
    schema: (TargetResource, implemented = true) => (() => {
        if (implemented) {
            it("should be implemented", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("schema"),
                    "Resource did not implement static member 'schema'");
            });
            
            it("should be an instance of Schema", () => {
                assert.ok(TargetResource.schema.prototype instanceof SCIMMY.Types.Schema,
                    "Static member 'schema' was not a Schema");
            });
        } else {
            it("should not be implemented", () => {
                assert.ok(!Object.getOwnPropertyNames(TargetResource).includes("schema"),
                    "Static member 'schema' unexpectedly implemented by resource");
            });
        }
    }),
    extend: (TargetResource, overrides = false) => (() => {
        if (!overrides) {
            it("should not be overridden", () => {
                assert.ok(!Object.getOwnPropertyNames(TargetResource).includes("extend"),
                    "Static method 'extend' unexpectedly overridden by resource");
            });
        } else {
            it("should be overridden", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("extend"),
                    "Resource did not override static method 'extend'");
                assert.ok(typeof TargetResource.extend === "function",
                    "Static method 'extend' was not a function");
            });
            
            it("should throw an 'unsupported' error", () => {
                assert.throws(() => TargetResource.extend(),
                    {name: "TypeError", message: `SCIM '${TargetResource.name}' resource does not support extension`},
                    "Static method 'extend' did not throw failure");
            });
        }
    }),
    ingress: (TargetResource, fixtures) => (() => {
        if (!fixtures) {
            it("should not be implemented", () => {
                assert.throws(() => TargetResource.ingress(),
                    {name: "TypeError", message: `Method 'ingress' not implemented by resource '${TargetResource.name}'`},
                    "Static method 'ingress' unexpectedly implemented by resource");
            });
        } else {
            const handler = async (res, instance) => {
                const {id} = res ?? {};
                
                switch (id) {
                    case "TypeError":
                        throw new TypeError("Failing as requested");
                    case "SCIMError":
                        throw new SCIMError(500, "invalidVers", "Failing as requested");
                    default:
                        const {egress} = await fixtures;
                        const target = Object.assign(
                            egress.find(f => f.id === id) ?? {id: "5"},
                            JSON.parse(JSON.stringify({...instance, schemas: undefined, meta: undefined}))
                        );
                        
                        if (!egress.includes(target)) {
                            if (!!id) throw new Error("Not found");
                            else egress.push(target);
                        }
                        
                        return target;
                }
            };
            
            it("should be implemented", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("ingress"),
                    "Resource did not implement static method 'ingress'");
                assert.ok(typeof TargetResource.ingress === "function",
                    "Static method 'ingress' was not a function");
            });
            
            it("should set private ingress handler", () => {
                assert.strictEqual(TargetResource.ingress(handler), TargetResource,
                    "Static method 'ingress' did not correctly set ingress handler");
            });
        }
    }),
    egress: (TargetResource, fixtures) => (() => {
        if (!fixtures) {
            it("should not be implemented", () => {
                assert.throws(() => TargetResource.egress(),
                    {name: "TypeError", message: `Method 'egress' not implemented by resource '${TargetResource.name}'`},
                    "Static method 'egress' unexpectedly implemented by resource");
            });
        } else {
            const handler = async (res) => {
                const {id} = res ?? {};
                
                switch (id) {
                    case "TypeError":
                        throw new TypeError("Failing as requested");
                    case "SCIMError":
                        throw new SCIMError(500, "invalidVers", "Failing as requested");
                    default:
                        const {egress} = await fixtures;
                        const target = (!!id ? egress.find(f => f.id === id) : egress);
                        
                        if (!target) throw new Error("Not found");
                        else return (Array.isArray(target) ? target : [target]);
                }
            };
            
            it("should be implemented", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("egress"),
                    "Resource did not implement static method 'egress'");
                assert.ok(typeof TargetResource.egress === "function",
                    "Static method 'egress' was not a function");
            });
            
            it("should set private egress handler", () => {
                assert.strictEqual(TargetResource.egress(handler), TargetResource,
                    "Static method 'egress' did not correctly set egress handler");
            });
        }
    }),
    degress: (TargetResource, fixtures) => (() => {
        if (!fixtures) {
            it("should not be implemented", () => {
                assert.throws(() => TargetResource.degress(),
                    {name: "TypeError", message: `Method 'degress' not implemented by resource '${TargetResource.name}'`},
                    "Static method 'degress' unexpectedly implemented by resource");
            });
        } else {
            const handler = async (res) => {
                const {id} = res ?? {};
                
                switch (id) {
                    case "TypeError":
                        throw new TypeError("Failing as requested");
                    case "SCIMError":
                        throw new SCIMError(500, "invalidVers", "Failing as requested");
                    default:
                        const {egress} = await fixtures;
                        const index = egress.indexOf(egress.find(f => f.id === id));
                        
                        if (index < 0) throw new Error("Not found");
                        else egress.splice(index, 1);
                }
            };
            
            it("should be implemented", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("degress"),
                    "Resource did not implement static method 'degress'");
                assert.ok(typeof TargetResource.degress === "function",
                    "Static method 'degress' was not a function");
            });
            
            it("should set private degress handler", () => {
                assert.strictEqual(TargetResource.degress(handler), TargetResource,
                    "Static method 'degress' did not correctly set degress handler");
            });
        }
    }),
    basepath: (TargetResource) => (() => {
        it("should be implemented", () => {
            assert.ok(Object.getOwnPropertyNames(TargetResource).includes("basepath"),
                "Static method 'basepath' was not implemented by resource");
            assert.ok(typeof TargetResource.basepath === "function",
                "Static method 'basepath' was not a function");
        });
        
        it("should only set basepath once, then do nothing", () => {
            const expected = `/scim${TargetResource.endpoint}`;
            
            TargetResource.basepath("/scim");
            assert.ok(TargetResource.basepath() === (expected),
                "Static method 'basepath' did not set or ignore resource basepath");
            
            TargetResource.basepath("/test");
            assert.ok(TargetResource.basepath() === (expected),
                "Static method 'basepath' did not do nothing when basepath was already set");
        });
    }),
    construct: (TargetResource, filterable = true) => (() => {
        it("should not require arguments at instantiation", () => {
            assert.doesNotThrow(() => new TargetResource(),
                "Resource did not instantiate without arguments");
        });
        
        if (filterable) {
            it("should expect query parameters to be an object", () => {
                const fixtures = [
                    ["number value '1'", 1],
                    ["boolean value 'false'", false],
                    ["array value", []]
                ];
                
                for (let [label, value] of fixtures) {
                    assert.throws(() => new TargetResource(value),
                        {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                            message: "Expected query parameters to be a single complex object value"},
                        `Resource did not reject query parameters ${label}`);
                }
            });
            
            it("should expect 'id' argument to be a non-empty string, if supplied", () => {
                const fixtures = [
                    ["null value", null],
                    ["number value '1'", 1],
                    ["boolean value 'false'", false],
                    ["array value", []]
                ];
                
                for (let [label, value] of fixtures) {
                    assert.throws(() => new TargetResource(value, {}),
                        {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                            message: "Expected 'id' parameter to be a non-empty string"},
                        `Resource did not reject 'id' parameter ${label}`);
                }
            });
            
            const suites = [
                ["filter", "non-empty"],
                ["excludedAttributes", "comma-separated list"],
                ["attributes", "comma-separated list"]
            ];
            
            const fixtures = [
                ["object value", {}],
                ["number value '1'", 1],
                ["boolean value 'false'", false],
                ["array value", []]
            ];
            
            for (let [prop, type] of suites) {
                it(`should expect '${prop}' property of query parameters to be a ${type} string`, () => {
                    for (let [label, value] of fixtures) {
                        assert.throws(() => new TargetResource({[prop]: value}),
                            {name: "SCIMError", status: 400, scimType: "invalidFilter",
                                message: `Expected ${prop} to be a ${type} string`},
                            `Resource did not reject '${prop}' property of query parameter with ${label}`);
                    }
                });
            }
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
        if (!fixtures) {
            it("should not be implemented", () => {
                assert.throws(() => new TargetResource().read(),
                    {name: "TypeError", message: `Method 'read' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'read' unexpectedly implemented by resource");
            });
        } else {
            it("should be implemented", () => {
                assert.ok("read" in (new TargetResource()),
                    "Resource did not implement instance method 'read'");
                assert.ok(typeof (new TargetResource()).read === "function",
                    "Instance method 'read' was not a function");
            });
            
            if (listable) {
                it("should call egress to return a ListResponse if resource was instantiated without an ID", async () => {
                    const {egress: expected} = await fixtures;
                    const result = await (new TargetResource()).read();
                    const resources = result?.Resources.map(r => JSON.parse(JSON.stringify({
                        ...r, schemas: undefined, meta: undefined, attributes: undefined
                    })));
                    
                    assert.ok(result instanceof SCIMMY.Messages.ListResponse,
                        "Instance method 'read' did not return a ListResponse when resource instantiated without an ID");
                    assert.deepStrictEqual(resources, expected,
                        "Instance method 'read' did not return a ListResponse containing all resources from fixture");
                });
                
                it("should call egress to return the requested resource instance if resource was instantiated with an ID", async () => {
                    const {egress: [expected]} = await fixtures;
                    const actual = JSON.parse(JSON.stringify({
                        ...await (new TargetResource(expected.id)).read(),
                        schemas: undefined, meta: undefined, attributes: undefined
                    }));
                    
                    assert.deepStrictEqual(actual, expected,
                        "Instance method 'read' did not return the requested resource instance by ID");
                });
                
                it("should expect a resource with supplied ID to exist", async () => {
                    await assert.rejects(() => new TargetResource("10").read(),
                        {name: "SCIMError", status: 404, scimType: null, message: /10 not found/},
                        "Instance method 'read' did not expect requested resource to exist");
                });
            } else {
                it("should return the requested resource without sugar-coating", async () => {
                    const {egress: expected} = await fixtures;
                    const actual = JSON.parse(JSON.stringify({
                        ...await (new TargetResource()).read(), schemas: undefined, meta: undefined
                    }));
                    
                    assert.deepStrictEqual(actual, expected,
                        "Instance method 'read' did not return the requested resource without sugar-coating");
                });
            }
        }
    }),
    write: (TargetResource, fixtures) => (() => {
        if (!fixtures) {
            it("should not be implemented", () => {
                assert.throws(() => new TargetResource().write(),
                    {name: "TypeError", message: `Method 'write' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'write' unexpectedly implemented by resource");
            });
        } else {
            it("should be implemented", () => {
                assert.ok("write" in (new TargetResource()),
                    "Resource did not implement instance method 'write'");
                assert.ok(typeof (new TargetResource()).write === "function",
                    "Instance method 'write' was not a function");
            });
            
            it("should expect 'instance' argument to be an object", async () => {
                const suites = [
                    ["POST", "new resources"],
                    ["PUT", "existing resources", "1"]
                ];
                
                const fixtures = [
                    ["string value 'a string'", "a string"],
                    ["number value '1'", 1],
                    ["boolean value 'false'", false],
                    ["array value", []]
                ];
                
                for (let [method, name, value] of suites) {
                    const resource = new TargetResource(value);
                    
                    await assert.rejects(() => resource.write(),
                        {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                            message: `Missing request body payload for ${method} operation`},
                        `Instance method 'write' did not expect 'instance' parameter to exist for ${name}`);
                    
                    for (let [label, value] of fixtures) {
                        await assert.rejects(() => resource.write(value),
                            {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                                message: `Operation ${method} expected request body payload to be single complex value`},
                            `Instance method 'write' did not reject 'instance' parameter ${label} for ${name}`);
                    }
                }
            });
            
            it("should call ingress to create new resources when resource instantiated without ID", async () => {
                const {ingress: source} = await fixtures;
                const result = await (new TargetResource()).write(source);
                
                assert.deepStrictEqual(await (new TargetResource(result.id)).read(), result,
                    "Instance method 'write' did not create new resource");
            });
            
            it("should call ingress to update existing resources when resource instantiated with ID", async () => {
                const {egress: [fixture]} = await fixtures;
                const [, target] = Object.keys(fixture);
                const instance = {...fixture, [target]: "TEST"};
                const expected = await (new TargetResource(fixture.id)).write(instance);
                const actual = await (new TargetResource(fixture.id)).read();
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'write' did not update existing resource");
            });
            
            it("should expect a resource with supplied ID to exist", async () => {
                const {ingress: source} = await fixtures;
                await assert.rejects(() => new TargetResource("10").write(source),
                    {name: "SCIMError", status: 404, scimType: null, message: /10 not found/},
                    "Instance method 'write' did not expect requested resource to exist");
            });
            
            it("should rethrow SCIMErrors", async () => {
                const {ingress: source} = await fixtures;
                await assert.rejects(() => new TargetResource("SCIMError").write(source),
                    {name: "SCIMError", status: 500, scimType: "invalidVers", message: "Failing as requested"},
                    "Instance method 'write' did not rethrow SCIM Errors");
            });
            
            it("should rethrow TypeErrors as SCIMErrors", async () => {
                const {ingress: source} = await fixtures;
                await assert.rejects(() => new TargetResource("TypeError").write(source),
                    {name: "SCIMError", status: 400, scimType: "invalidValue", message: "Failing as requested"},
                    "Instance method 'write' did not rethrow TypeError as SCIMError");
            });
        }
    }),
    patch: (TargetResource, fixtures) => (() => {
        if (!fixtures) {
            it("should not be implemented", () => {
                assert.throws(() => new TargetResource().patch(),
                    {name: "TypeError", message: `Method 'patch' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'patch' unexpectedly implemented by resource");
            });
        } else {
            it("should be implemented", () => {
                assert.ok("patch" in (new TargetResource()),
                    "Resource did not implement instance method 'patch'");
                assert.ok(typeof (new TargetResource()).patch === "function",
                    "Instance method 'patch' was not a function");
            });
            
            it("should expect 'message' argument to be an object", async () => {
                const fixtures = [
                    ["string value 'a string'", "a string"],
                    ["boolean value 'false'", false],
                    ["array value", []]
                ];
                
                await assert.rejects(() => new TargetResource().patch(),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "Missing message body from PatchOp request"},
                    "Instance method 'patch' did not expect 'message' parameter to exist");
                
                for (let [label, value] of fixtures) {
                    await assert.rejects(() => new TargetResource().patch(value),
                        {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                            message: "PatchOp request expected message body to be single complex value"},
                        `Instance method 'patch' did not reject 'message' parameter ${label}`);
                }
            });
            
            it("should return nothing when applied PatchOp does not modify resource", async () => {
                const {egress: [fixture]} = await fixtures;
                const [, target] = Object.keys(fixture);
                const result = await (new TargetResource(fixture.id)).patch({
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", path: target, value: "TEST"}]
                });
                
                assert.deepStrictEqual(result, undefined,
                    "Instance method 'patch' did not return nothing when resource was not modified");
            });
            
            it("should return the full resource when applied PatchOp modifies resource", async () => {
                const {egress: [fixture]} = await fixtures;
                const [, target] = Object.keys(fixture);
                const expected = {...fixture, [target]: "Test"};
                const actual = await (new TargetResource(fixture.id)).patch({
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", path: target, value: "Test"}]
                });
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify({...actual, schemas: undefined, meta: undefined})), expected,
                    "Instance method 'patch' did not return the full resource when resource was modified");
            });
            
            it("should expect a resource with supplied ID to exist", async () => {
                const {ingress: source} = await fixtures;
                const message = {
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", value: source}]
                };
                
                await assert.rejects(() => new TargetResource("10").patch(message),
                    {name: "SCIMError", status: 404, scimType: null, message: /10 not found/},
                    "Instance method 'patch' did not expect requested resource to exist");
            });
            
            it("should rethrow SCIMErrors", async () => {
                const {ingress: source} = await fixtures;
                const message = {
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", value: source}]
                };
                
                await assert.rejects(() => new TargetResource("SCIMError").patch(message),
                    {name: "SCIMError", status: 500, scimType: "invalidVers", message: "Failing as requested"},
                    "Instance method 'patch' did not rethrow SCIM Errors");
            });
            
            it("should rethrow TypeErrors as SCIMErrors", async () => {
                const {ingress: source} = await fixtures;
                const message = {
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", value: source}]
                };
                
                await assert.rejects(() => new TargetResource("TypeError").patch(message),
                    {name: "SCIMError", status: 400, scimType: "invalidValue", message: "Failing as requested"},
                    "Instance method 'patch' did not rethrow TypeError as SCIMError");
            });
        }
    }),
    dispose: (TargetResource, fixtures) => (() => {
        if (!fixtures) {
            it("should not be implemented", () => {
                assert.throws(() => new TargetResource().dispose(),
                    {name: "TypeError", message: `Method 'dispose' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'dispose' unexpectedly implemented by resource");
            });
        } else {
            it("should be implemented", () => {
                assert.ok("dispose" in (new TargetResource()),
                    "Resource did not implement instance method 'dispose'");
                assert.ok(typeof (new TargetResource()).dispose === "function",
                    "Instance method 'dispose' was not a function");
            });
            
            it("should expect resource instances to have 'id' property", async () => {
                await assert.rejects(() => new TargetResource().dispose(),
                    {name: "SCIMError", status: 404, scimType: null,
                        message: "DELETE operation must target a specific resource"},
                    "Instance method 'dispose' did not expect resource instance to have 'id' property");
            });
            
            it("should call degress to delete a resource instance", async () => {
                await assert.doesNotReject(() => new TargetResource("5").dispose(),
                    "Instance method 'dispose' rejected a valid degress request");
                await assert.rejects(() => new TargetResource("5").dispose(),
                    {name: "SCIMError", status: 404, scimType: null, message: /5 not found/},
                    "Instance method 'dispose' did not delete the given resource");
            });
            
            it("should expect a resource with supplied ID to exist", async () => {
                await assert.rejects(() => new TargetResource("5").dispose(),
                    {name: "SCIMError", status: 404, scimType: null, message: /5 not found/},
                    "Instance method 'dispose' did not expect requested resource to exist");
            });
            
            it("should rethrow SCIMErrors", async () => {
                await assert.rejects(() => new TargetResource("SCIMError").dispose(),
                    {name: "SCIMError", status: 500, scimType: "invalidVers", message: "Failing as requested"},
                    "Instance method 'dispose' did not rethrow SCIM Errors");
            });
            
            it("should rethrow TypeErrors as SCIMErrors", async () => {
                await assert.rejects(() => new TargetResource("TypeError").dispose(),
                    {name: "SCIMError", status: 500, scimType: null, message: "Failing as requested"},
                    "Instance method 'dispose' did not rethrow TypeError as SCIMError");
            });
        }
    })
};