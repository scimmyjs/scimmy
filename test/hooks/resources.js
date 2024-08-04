import assert from "assert";
import sinon from "sinon";
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
        static endpoint = `/${name}`;
        static schema = createSchemaClass({...rest, name});
    }
);

export default class ResourcesHooks {
    #target;
    #fixtures;
    #sandbox;
    #handlers;
    
    constructor(TargetResource, fixtures) {
        this.#target = TargetResource;
        this.#fixtures = fixtures;
        this.#sandbox = sinon.createSandbox();
        this.#handlers = this.#sandbox.stub({
            ingress: async (res, instance) => {
                const {id} = res ?? {};
                const {egress} = await fixtures;
                const target = Object.assign(
                    egress.find(f => f.id === id) ?? {id: `${Number(egress.at(-1)?.id)+1}`},
                    JSON.parse(JSON.stringify({...instance, schemas: undefined, meta: undefined}))
                );
                
                if (!egress.includes(target)) {
                    if (!!id) throw new Error("Not found");
                    else egress.push(target);
                }
                
                return target;
            },
            egress: async (res) => {
                const {id} = res ?? {};
                const {egress} = await fixtures;
                const target = (!!id ? egress.find(f => f.id === id) : egress);
                
                if (!target) throw new Error("Not found");
                else return target;
            },
            degress: async (res) => {
                const {id} = res ?? {};
                const {egress} = await fixtures;
                const index = egress.indexOf(egress.find(f => f.id === id));
                
                if (index < 0) throw new Error("Not found");
                else egress.splice(index, 1);
            }
        });
    }
    
    endpoint = () => (() => {
        const TargetResource = this.#target;
        
        it("should be implemented", () => {
            assert.ok(Object.getOwnPropertyNames(TargetResource).includes("endpoint"),
                "Static member 'endpoint' was not implemented");
        });
        
        it("should be a string", () => {
            assert.ok(typeof TargetResource.endpoint === "string",
                "Static member 'endpoint' was not a string");
        });
    });
    
    schema = (supported = true) => (() => {
        const TargetResource = this.#target;
        
        if (!supported) {
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
    });
    
    basepath = () => (() => {
        const TargetResource = this.#target;
        
        it("should be implemented", () => {
            assert.ok(Object.getOwnPropertyNames(TargetResource).includes("basepath"),
                "Static method 'basepath' was not implemented");
            assert.ok(typeof this.#target.basepath === "function",
                "Static method 'basepath' was not a function");
        });
        
        it("should be mutable", () => {
            TargetResource.basepath("/scim");
            assert.ok(this.#target.basepath() === (`/scim${TargetResource.endpoint}`),
                `Static method 'basepath' did not set resource basepath to '/scim${TargetResource.endpoint}'`);
            
            TargetResource.basepath("/test");
            assert.ok(this.#target.basepath() === (`/test${TargetResource.endpoint}`),
                `Static method 'basepath' did not set resource basepath to '/test${TargetResource.endpoint}'`);
        });
    });
    
    extend = (supported = true) => (() => {
        const TargetResource = this.#target;
        
        if (supported) {
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
    });
    
    ingress = (supported = false) => (() => {
        const TargetResource = this.#target;
        
        if (!supported) {
            it("should not be implemented", () => {
                assert.throws(() => TargetResource.ingress(),
                    {name: "TypeError", message: `Method 'ingress' not implemented by resource '${TargetResource.name}'`},
                    "Static method 'ingress' unexpectedly implemented by resource");
            });
        } else {
            const fixtures = this.#fixtures;
            const sandbox = this.#sandbox;
            
            it("should be implemented", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("ingress"),
                    "Static method 'ingress' was not implemented");
                assert.ok(typeof TargetResource.ingress === "function",
                    "Static method 'ingress' was not a function");
            });
            
            it("should include a fallback private ingress handler", async () => {
                const {egress: [source]} = await fixtures;
                
                await assert.rejects(() => new TargetResource().write(source),
                    {name: "SCIMError", status: 501, scimType: null, message: /not implemented by resource/},
                    "Static method 'ingress' did not include fallback private handler");
            });
            
            it("should set private ingress handler", async () => {
                const {egress: [source]} = await fixtures;
                const spy = sandbox.spy(TargetResource, "ingress");
                const error = new Error("Handler Stubbed");
                const handler = sandbox.stub().throws(error);
                
                try {
                    TargetResource.ingress(handler);
                } catch {
                    assert.fail("Static method 'ingress' failed while setting handler");
                } finally {
                    assert.ok(spy.calledWith(sinon.match.same(handler)),
                        "Static method 'ingress' was not called with handler method");
                    spy.restore();
                }
                
                assert.ok(await new TargetResource().write(source).then(() => false, () => handler.threw(error)),
                    "Static method 'ingress' did not correctly set ingress handler");
            });
        }
    });
    
    egress = (supported = false) => (() => {
        const TargetResource = this.#target;
        
        if (!supported) {
            it("should not be implemented", () => {
                assert.throws(() => TargetResource.egress(),
                    {name: "TypeError", message: `Method 'egress' not implemented by resource '${TargetResource.name}'`},
                    "Static method 'egress' unexpectedly implemented by resource");
            });
        } else {
            const sandbox = this.#sandbox;
            
            it("should be implemented", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("egress"),
                    "Static method 'egress' was not implemented");
                assert.ok(typeof TargetResource.egress === "function",
                    "Static method 'egress' was not a function");
            });
            
            it("should include a fallback private egress handler", async () => {
                await assert.rejects(() => new TargetResource("placeholder").read(),
                    {name: "SCIMError", status: 501, scimType: null, message: /not implemented by resource/},
                    "Static method 'egress' did not include fallback private handler");
            });
            
            it("should set private egress handler", async () => {
                const spy = sandbox.spy(TargetResource, "egress");
                const error = new Error("Handler Stubbed");
                const handler = sandbox.stub().throws(error);
                
                try {
                    TargetResource.egress(handler);
                } catch {
                    assert.fail("Static method 'egress' failed while setting handler");
                } finally {
                    assert.ok(spy.calledWith(sinon.match.same(handler)),
                        "Static method 'egress' was not called with handler method");
                    spy.restore();
                }
                
                assert.ok(await new TargetResource().read().then(() => false, () => handler.threw(error)),
                    "Static method 'egress' did not correctly set egress handler");
            });
        }
    });
    
    degress = (supported = false) => (() => {
        const TargetResource = this.#target;
        
        if (!supported) {
            it("should not be implemented", () => {
                assert.throws(() => TargetResource.degress(),
                    {name: "TypeError", message: `Method 'degress' not implemented by resource '${TargetResource.name}'`},
                    "Static method 'degress' unexpectedly implemented by resource");
            });
        } else {
            const sandbox = this.#sandbox;
            
            it("should be implemented", () => {
                assert.ok(Object.getOwnPropertyNames(TargetResource).includes("degress"),
                    "Static method 'degress' was not implemented");
                assert.ok(typeof TargetResource.degress === "function",
                    "Static method 'degress' was not a function");
            });
            
            it("should include a fallback private degress handler", async () => {
                await assert.rejects(() => new TargetResource("Error").dispose(),
                    {name: "SCIMError", status: 501, scimType: null, message: /not implemented by resource/},
                    "Static method 'degress' did not include fallback private handler");
            });
            
            it("should set private degress handler", async () => {
                const spy = sandbox.spy(TargetResource, "degress");
                const error = new Error("Handler Stubbed");
                const handler = sandbox.stub().throws(error);
                
                try {
                    TargetResource.degress(handler);
                } catch {
                    assert.fail("Static method 'degress' did not correctly set egress handler");
                } finally {
                    assert.ok(spy.calledWith(sinon.match.same(handler)),
                        "Static method 'degress' was not called with handler method");
                    spy.restore();
                }
                
                assert.ok(await new TargetResource("Error").dispose().then(() => false, () => handler.threw(error)),
                    "Static method 'degress' did not correctly set degress handler");
            });
        }
    });
    
    construct = (filterable = true) => (() => {
        const TargetResource = this.#target;
        
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
    });
    
    read = (listable = true, callsEgress = false) => (() => {
        const TargetResource = this.#target;
        const fixtures = this.#fixtures;
        const handler = this.#handlers.egress;
        let skip = false;
        
        it("should be implemented", () => {
            assert.ok("read" in (new TargetResource()),
                "Instance method 'read' was not implemented");
            assert.ok(typeof (new TargetResource()).read === "function",
                "Instance method 'read' was not a function");
        });
        
        if (callsEgress) {
            afterEach(() => handler.reset());
            beforeEach(() => handler.callThrough());
            before(() => {
                try {
                    TargetResource.egress(handler);
                } catch {
                    skip = true;
                }
            });
        }
        
        if (listable) {
            (skip ? it.skip : it)(`should ${callsEgress ? "call egress to " : ""}return a ListResponse if resource was instantiated without an ID`, async () => {
                const {egress: expected} = await fixtures;
                const resource = new TargetResource();
                const result = await resource.read();
                const resources = result?.Resources.map(r => JSON.parse(JSON.stringify({
                    ...r, schemas: undefined, meta: undefined, attributes: undefined
                })));
                
                assert.ok(!callsEgress || handler.calledWith(sinon.match.same(resource)),
                    "Instance method 'read' did not call egress handler");
                assert.ok(result instanceof ListResponse,
                    "Instance method 'read' did not return a ListResponse when resource instantiated without an ID");
                assert.deepStrictEqual(resources, expected,
                    "Instance method 'read' did not return a ListResponse containing all resources from fixture");
            });
            
            (skip ? it.skip : it)(`should ${callsEgress ? "call egress to " : ""}return the requested resource instance if resource was instantiated with an ID`, async () => {
                const {egress: [expected]} = await fixtures;
                const resource = new TargetResource(expected.id);
                const actual = JSON.parse(JSON.stringify({
                    ...await resource.read(),
                    schemas: undefined, meta: undefined, attributes: undefined
                }));
                
                assert.ok(!callsEgress || handler.calledWith(sinon.match.same(resource)),
                    "Instance method 'read' did not call egress handler");
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'read' did not return the requested resource instance by ID");
            });
            
            (skip ? it.skip : it)("should expect a resource with supplied ID to exist", async () => {
                await assert.rejects(() => new TargetResource("10").read(),
                    {name: "SCIMError", status: 404, scimType: null, message: /10 not found/},
                    "Instance method 'read' did not expect requested resource to exist");
            });
            
            if (callsEgress) {
                (skip ? it.skip : it)("should throw exception for empty values returned by handler", async () => {
                    handler.reset();
                    handler.returns(undefined);
                    
                    await assert.rejects(() => new TargetResource("placeholder").read(),
                        {name: "SCIMError", status: 500, scimType: null,
                            message: "Unexpected empty value returned by handler"},
                        "Instance method 'read' did not throw exception for empty values returned by handler");
                });
                
                (skip ? it.skip : it)("should call egress handler method with originating resource instance as an argument", async () => {
                    const resource = new TargetResource();
                    
                    await resource.read();
                    
                    assert.ok(handler.calledWith(sinon.match.same(resource)),
                        "Instance method 'read' did not call egress handler with originating resource instance");
                });
                
                (skip ? it.skip : it)("should call egress method with supplied context as an argument", async () => {
                    const context = {};
                    const resource = new TargetResource();
                    
                    await resource.read(context);
                    
                    assert.ok(handler.calledWith(sinon.match.same(resource), sinon.match.same(context)),
                        "Instance method 'read' did not call egress handler with supplied context");
                });
                
                (skip ? it.skip : it)("should treat length of array returned by egress method as 'totalResults' value in ListResponse if resource was instantiated without an ID", async () => {
                    const {egress: resources} = await fixtures;
                    const expected = 1000;
                    
                    handler.callsFake(() => Object.assign([...resources], {length: expected}));
                    
                    assert.strictEqual((await new TargetResource().read()).totalResults, expected,
                        "Instance method 'read' did not treat length of array returned by egress method as 'totalResults' value");
                });
                
                (skip ? it.skip : it)("should honour 'startIndex' constraint in ListResponse if resource was instantiated without an ID", async () => {
                    await fixtures.then(({egress}) => Array.from(new Array(5), () => egress).flat())
                        .then((resources) => handler.callsFake(() => resources));
                    
                    const expected = {startIndex: 18, resourceIds: ["2", "3", "4"]}
                    const resource = new TargetResource({startIndex: expected.startIndex});
                    const actual = await resource.read();
                    
                    assert.strictEqual(actual.startIndex, expected.startIndex,
                        "Instance method 'read' did not pass 'startIndex' constraint to ListResponse");
                    assert.deepStrictEqual(actual.Resources.map(({id}) => id), expected.resourceIds,
                        "Instance method 'read' did not offset results in ListResponse to honour 'startIndex'");
                });
                
                (skip ? it.skip : it)("should rethrow SCIMErrors thrown by handler", async () => {
                    handler.throws(() => new SCIMError(500, "invalidVers", "Failing as requested"));
                    
                    await assert.rejects(() => new TargetResource("placeholder").read(),
                        {name: "SCIMError", status: 500, scimType: "invalidVers", message: "Failing as requested"},
                        "Instance method 'read' did not rethrow SCIM Errors");
                });
                
                (skip ? it.skip : it)("should rethrow TypeErrors thrown by handler as SCIMErrors", async () => {
                    handler.throws(() => new TypeError("Failing as requested"));
                    
                    await assert.rejects(() => new TargetResource("placeholder").read(),
                        {name: "SCIMError", status: 400, scimType: "invalidValue", message: "Failing as requested"},
                        "Instance method 'read' did not rethrow TypeError as SCIMError");
                });
            }
        } else {
            (skip ? it.skip : it)("should return the requested resource without sugar-coating", async () => {
                const {egress: expected} = await fixtures;
                const actual = JSON.parse(JSON.stringify({
                    ...await (new TargetResource()).read(), schemas: undefined, meta: undefined
                }));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'read' did not return the requested resource without sugar-coating");
            });
        }
    });
    
    write = (supported = false) => (() => {
        const TargetResource = this.#target;
        
        if (!supported) {
            it("should not be implemented", () => {
                assert.throws(() => new TargetResource().write(),
                    {name: "TypeError", message: `Method 'write' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'write' unexpectedly implemented by resource");
            });
        } else {
            const fixtures = this.#fixtures;
            const handler = this.#handlers.ingress;
            let skip = false;
            
            afterEach(() => handler.reset());
            beforeEach(() => handler.callThrough());
            before(() => {
                try {
                    TargetResource.ingress(handler);
                } catch {
                    skip = true;
                }
            });
            
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
            
            (skip ? it.skip : it)("should throw exception for empty values returned by handler", async () => {
                const {ingress: source} = await fixtures;
                
                handler.reset();
                handler.returns(undefined);
                
                await assert.rejects(() => new TargetResource().write(source),
                    {name: "SCIMError", status: 500, scimType: null,
                        message: "Unexpected empty value returned by handler"},
                    "Instance method 'write' did not throw exception for empty values returned by handler");
            });
            
            (skip ? it.skip : it)("should call ingress to create new resources when resource instantiated without ID", async () => {
                const {ingress: source, egress: resources} = await fixtures;
                const actual = await (new TargetResource()).write(source);
                const expected = resources.at(-1);
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify({...actual, schemas: undefined, meta: undefined})), expected,
                    "Instance method 'write' did not create new resource");
            });
            
            (skip ? it.skip : it)("should call ingress to update existing resources when resource instantiated with ID", async () => {
                const {egress: [fixture]} = await fixtures;
                const [, target] = Object.keys(fixture);
                const expected = {...fixture, [target]: "TEST"};
                const actual = await (new TargetResource(fixture.id)).write(expected);
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify({...actual, schemas: undefined, meta: undefined})), expected,
                    "Instance method 'write' did not update existing resource");
            });
            
            (skip ? it.skip : it)("should expect a resource with supplied ID to exist", async () => {
                const {ingress: source} = await fixtures;
                await assert.rejects(() => new TargetResource("10").write(source),
                    {name: "SCIMError", status: 404, scimType: null, message: /10 not found/},
                    "Instance method 'write' did not expect requested resource to exist");
            });
            
            (skip ? it.skip : it)("should call ingress handler method with originating resource instance as an argument", async () => {
                const {ingress: source, egress: resources} = await fixtures;
                const resource = new TargetResource(resources.at(-1).id);
                
                await resource.write(source);
                
                assert.ok(handler.calledWith(sinon.match.same(resource), sinon.match.instanceOf(TargetResource.schema)),
                    "Instance method 'write' did not call ingress handler with originating resource instance");
            });
            
            (skip ? it.skip : it)("should call ingress method with supplied context as an argument", async () => {
                const {ingress: source, egress: resources} = await fixtures;
                const resource = new TargetResource(resources.at(-1).id);
                const context = {};
                
                await resource.write(source, context);
                
                assert.ok(handler.calledWith(sinon.match.same(resource), sinon.match.instanceOf(TargetResource.schema), sinon.match.same(context)),
                    "Instance method 'write' did not call ingress handler with supplied context");
            });
            
            (skip ? it.skip : it)("should rethrow SCIMErrors thrown by handler", async () => {
                const {ingress: source} = await fixtures;
                
                handler.throws(() => new SCIMError(500, "invalidVers", "Failing as requested"));
                
                await assert.rejects(() => new TargetResource("SCIMError").write(source),
                    {name: "SCIMError", status: 500, scimType: "invalidVers", message: "Failing as requested"},
                    "Instance method 'write' did not rethrow SCIM Errors");
            });
            
            (skip ? it.skip : it)("should rethrow TypeErrors thrown by handler as SCIMErrors", async () => {
                const {ingress: source} = await fixtures;
                
                handler.throws(() => new TypeError("Failing as requested"));
                
                await assert.rejects(() => new TargetResource("TypeError").write(source),
                    {name: "SCIMError", status: 400, scimType: "invalidValue", message: "Failing as requested"},
                    "Instance method 'write' did not rethrow TypeError as SCIMError");
            });
        }
    });
    
    patch = (supported = false) => (() => {
        const TargetResource = this.#target;
        
        if (!supported) {
            it("should not be implemented", () => {
                assert.throws(() => new TargetResource().patch(),
                    {name: "TypeError", message: `Method 'patch' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'patch' unexpectedly implemented by resource");
            });
        } else {
            const fixtures = this.#fixtures;
            const handlers = this.#handlers;
            const sandbox = this.#sandbox;
            let skip = false;
            
            afterEach(() => {handlers.ingress.reset(); handlers.egress.reset()});
            beforeEach(() => {handlers.ingress.callThrough(); handlers.egress.callThrough()});
            before(() => {
                try {
                    TargetResource.ingress(handlers.ingress);
                    TargetResource.egress(handlers.egress);
                } catch {
                    skip = true;
                }
            });
            
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
                
                await assert.rejects(() => new TargetResource("test").patch(),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "Missing message body from PatchOp request"},
                    "Instance method 'patch' did not expect 'message' parameter to exist");
                
                for (let [label, value] of fixtures) {
                    await assert.rejects(() => new TargetResource("test").patch(value),
                        {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                            message: "PatchOp request expected message body to be single complex value"},
                        `Instance method 'patch' did not reject 'message' parameter ${label}`);
                }
            });
            
            (skip ? it.skip : it)("should return nothing when applied PatchOp does not modify resource", async () => {
                const {egress: [fixture]} = await fixtures;
                const [, target] = Object.keys(fixture);
                const result = await (new TargetResource(fixture.id)).patch({
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", path: target, value: "TEST"}]
                });
                
                assert.deepStrictEqual(result, undefined,
                    "Instance method 'patch' did not return nothing when resource was not modified");
            });
            
            (skip ? it.skip : it)("should return the full resource when applied PatchOp modifies resource", async () => {
                const {egress: [fixture]} = await fixtures;
                const [, target] = Object.keys(fixture);
                const expected = {...fixture, [target]: "Test"};
                const actual = await new TargetResource(fixture.id).patch({
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", path: target, value: "Test"}]
                });
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify({...actual, schemas: undefined, meta: undefined})), expected,
                    "Instance method 'patch' did not return the full resource when resource was modified");
            });
            
            (skip ? it.skip : it)("should expect a resource with supplied ID to exist", async () => {
                const {ingress: source} = await fixtures;
                const message = {
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", value: source}]
                };
                
                await assert.rejects(() => new TargetResource("10").patch(message),
                    {name: "SCIMError", status: 404, scimType: null, message: /10 not found/},
                    "Instance method 'patch' did not expect requested resource to exist");
            });
            
            for (let method of ["ingress", "egress"]) {
                (skip ? it.skip : it)(`should call ${method} handler method exactly once`, async () => {
                    const {egress: [fixture]} = await fixtures;
                    const [, target] = Object.keys(fixture);
                    
                    await new TargetResource(fixture.id).patch({
                        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                        Operations: [{op: "add", path: target, value: "Test"}]
                    });
                    
                    assert.ok(handlers[method].calledOnce,
                        `Instance method 'patch' did not call ${method} handler exactly once`);
                });
                
                (skip ? it.skip : it)(`should rethrow exception for empty values returned by ${method} handler`, async () => {
                    const {ingress: source, egress: [fixture]} = await fixtures;
                    const message = {
                        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                        Operations: [{op: "add", value: source}]
                    };
                    
                    handlers[method].reset();
                    handlers[method].returns(undefined);
                    
                    await assert.rejects(() => new TargetResource(fixture.id).patch(message),
                        {name: "SCIMError", status: 500, scimType: null,
                            message: "Unexpected empty value returned by handler"},
                        `Instance method 'patch' did not rethrow exception for empty values returned by ${method} handler`);
                });
                
                (skip ? it.skip : it)(`should call ${method} handler method with originating resource instance as an argument`, async () => {
                    const {egress: [fixture]} = await fixtures;
                    const [, target] = Object.keys(fixture);
                    const resource = new TargetResource(fixture.id);
                    
                    await resource.patch({
                        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                        Operations: [{op: "add", path: target, value: "Test"}]
                    });
                    
                    assert.ok(handlers[method].calledWith(sinon.match.same(resource)),
                        `Instance method 'patch' did not call ${method} handler with originating resource instance`);
                });
                
                (skip ? it.skip : it)(`should call ${method} handler method with supplied context as an argument`, async () => {
                    const {egress: [fixture]} = await fixtures;
                    const [, target] = Object.keys(fixture);
                    const resource = new TargetResource(fixture.id);
                    const context = {};
                    const message = {
                        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                        Operations: [{op: "add", path: target, value: "Test"}]
                    };
                    
                    await resource.patch(message, context);
                    
                    assert.ok(
                        handlers[method].calledWith(
                            sinon.match.same(resource),
                            ...(method === "ingress" ? [sinon.match.instanceOf(TargetResource.schema)] : []),
                            sinon.match.same(context)
                        ),
                        `Instance method 'patch' did not call ${method} handler with supplied context`
                    );
                });
            }
            
            (skip ? it.skip : it)("should call egress handler before ingress handler", async () => {
                const {egress: [fixture]} = await fixtures;
                const [, target] = Object.keys(fixture);
                const resource = new TargetResource(fixture.id);
                const spy = sandbox.spy(resource, "patch");
                
                await resource.patch({
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", path: target, value: "Test"}]
                });
                
                try {
                    assert.ok(handlers.egress.calledOnce,
                        "Instance method 'patch' did not call egress handler");
                    assert.ok(handlers.ingress.calledOnce,
                        "Instance method 'patch' did not call ingress handler");
                    assert.ok(handlers.egress.calledImmediatelyBefore(handlers.ingress),
                        "Instance method 'patch' did not call egress handler before ingress handler");
                } finally {
                    spy.restore();
                }
            });
            
            (skip ? it.skip : it)("should rethrow SCIMErrors thrown by handlers", async () => {
                const {ingress: source, egress: [target]} = await fixtures;
                const message = {
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", value: source}]
                };
                
                for (let method of ["ingress", "egress"]) {
                    handlers[method].throws(() => new SCIMError(500, "invalidVers", "Failing as requested"));
                    
                    await assert.rejects(() => new TargetResource(target.id).patch(message),
                        {name: "SCIMError", status: 500, scimType: "invalidVers", message: "Failing as requested"},
                        "Instance method 'patch' did not rethrow SCIM Errors");
                }
            });
            
            (skip ? it.skip : it)("should rethrow TypeErrors thrown by handlers as SCIMErrors", async () => {
                const {ingress: source, egress: [target]} = await fixtures;
                const message = {
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [{op: "add", value: source}]
                };
                
                for (let method of ["ingress", "egress"]) {
                    handlers[method].throws(() => new TypeError("Failing as requested"));
                    
                    await assert.rejects(() => new TargetResource(target.id).patch(message),
                        {name: "SCIMError", status: 400, scimType: "invalidValue", message: "Failing as requested"},
                        `Instance method 'patch' did not rethrow ${method} handler TypeError as SCIMError`);
                }
            });
        }
    });
    
    dispose = (supported) => (() => {
        const TargetResource = this.#target;
        
        if (!supported) {
            it("should not be implemented", () => {
                assert.throws(() => new TargetResource().dispose(),
                    {name: "TypeError", message: `Method 'dispose' not implemented by resource '${TargetResource.name}'`},
                    "Instance method 'dispose' unexpectedly implemented by resource");
            });
        } else {
            const fixtures = this.#fixtures;
            const handler = this.#handlers.degress;
            let skip = false;
            
            afterEach(() => handler.reset());
            beforeEach(() => handler.callThrough());
            before(() => {
                try {
                    TargetResource.degress(handler);
                } catch {
                    skip = true;
                }
            });
            
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
            
            (skip ? it.skip : it)("should call degress to delete a resource instance", async () => {
                const {egress: resources, egress: [target]} = await fixtures;
                const resource = new TargetResource(target.id);
                
                try {
                    await resource.dispose();
                } catch {
                    assert.fail("Instance method 'dispose' rejected a valid degress request");
                }
                
                assert.ok(handler.calledWith(sinon.match.same(resource)),
                    "Instance method 'dispose' did not call degress handler");
                assert.ok(!resources.includes(target),
                    "Instance method 'dispose' did not remove targeted resource");
            });
            
            (skip ? it.skip : it)("should expect a resource with supplied ID to exist", async () => {
                await assert.rejects(() => new TargetResource("10").dispose(),
                    {name: "SCIMError", status: 404, scimType: null, message: /10 not found/},
                    "Instance method 'dispose' did not expect requested resource to exist");
            });
            
            (skip ? it.skip : it)("should call degress handler method with originating resource instance as an argument", async () => {
                const resource = new TargetResource("placeholder");
                
                handler.returnsArg(0);
                
                await resource.dispose();
                
                assert.ok(handler.calledWith(sinon.match.same(resource)),
                    "Instance method 'dispose' did not call degress handler with originating resource instance");
            });
            
            (skip ? it.skip : it)("should call degress method with supplied context as an argument", async () => {
                const resource = new TargetResource("placeholder");
                const context = {};
                
                handler.returnsArg(0);
                
                await resource.dispose(context);
                
                assert.ok(handler.calledWith(sinon.match.same(resource), sinon.match.same(context)),
                    "Instance method 'dispose' did not call degress handler with supplied context");
            });
            
            (skip ? it.skip : it)("should rethrow SCIMErrors thrown by handler", async () => {
                handler.throws(() => new SCIMError(500, "invalidVers", "Failing as requested"));
                
                await assert.rejects(() => new TargetResource("placeholder").dispose(),
                    {name: "SCIMError", status: 500, scimType: "invalidVers", message: "Failing as requested"},
                    "Instance method 'dispose' did not rethrow SCIM Errors");
            });
            
            (skip ? it.skip : it)("should rethrow TypeErrors thrown by handler as SCIMErrors", async () => {
                handler.throws(() => new TypeError("Failing as requested"));
                
                await assert.rejects(() => new TargetResource("placeholder").dispose(),
                    {name: "SCIMError", status: 500, scimType: null, message: "Failing as requested"},
                    "Instance method 'dispose' did not rethrow TypeError as SCIMError");
            });
        }
    })
};