import assert from "assert";
import {Schema} from "#@/lib/types/schema.js";
import {Resource} from "#@/lib/types/resource.js";
import {SCIMError} from "#@/lib/types/error.js";
import {ListResponse} from "#@/lib/messages/listresponse.js";
import {createSchemaClass} from "./schemas.js";

/**
 * Create a class that extends SCIMMY.Types.Resource, for use in tests
 * @param {String} [name=Test] - the name of the Resource to create a class for
 * @param {*[]} rest - arguments to pass through to the Schema class
 * @returns {typeof Resource} a class that extends SCIMMY.Types.Resource for use in tests
 */
export const createResourceClass = (name = "Test", ...rest) => (
    class Test extends Resource {
        static #endpoint = `/${name}`
        static get endpoint() { return Test.#endpoint; }
        static #schema = createSchemaClass({...rest, name});
        static get schema() { return Test.#schema; }
    }
);

export default {
    endpoint: (TargetResource) => (() => {
        it("should be implemented", () => {
            assert.ok(Object.getOwnPropertyNames(TargetResource).includes("endpoint"),
                "Static member 'endpoint' was not implemented");
        });
        
        it("should be a string", () => {
            assert.ok(typeof TargetResource.endpoint === "string",
                "Static member 'endpoint' was not a string");
        });
    }),
    schema: (TargetResource, implemented = true) => (() => {
        if (!implemented) {
            it("should not be implemented", () => {
                assert.ok(!Object.getOwnPropertyNames(TargetResource).includes("schema"),
                    "Static member 'schema' unexpectedly implemented by resource");
            });
        } else {
            it("should be implemented", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("schema"),
                    "Static member 'schema' was not implemented");
            });
        
            it("should be an instance of Schema", () => {
                assert.ok(TargetResource.schema.prototype instanceof Schema,
                    "Static member 'schema' was not a Schema");
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
                    "Static method 'extend' was not overridden");
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
                    "Static method 'ingress' was not implemented");
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
                    "Static method 'egress' was not implemented");
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
                    "Static method 'degress' was not implemented");
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
                "Static method 'basepath' was not implemented");
            assert.ok(typeof TargetResource.basepath === "function",
                "Static method 'basepath' was not a function");
        });
        
        it("should be mutable", () => {
            TargetResource.basepath("/scim");
            assert.ok(TargetResource.basepath() === (`/scim${TargetResource.endpoint}`),
                `Static method 'basepath' did not set resource basepath to '/scim${TargetResource.endpoint}'`);
            
            TargetResource.basepath("/test");
            assert.ok(TargetResource.basepath() === (`/test${TargetResource.endpoint}`),
                `Static method 'basepath' did not set resource basepath to '/test${TargetResource.endpoint}'`);
        });
    }),
    construct: (TargetResource, filterable = true) => (() => {
        it("should not require arguments", () => {
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
                    "Instance method 'read' was not implemented");
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
                    
                    assert.ok(result instanceof ListResponse,
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
                    "Instance method 'write' was not implemented");
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
                    "Instance method 'patch' was not implemented");
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
                    "Instance method 'dispose' was not implemented");
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