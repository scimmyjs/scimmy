import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import sinon from "sinon";
import * as Resources from "#@/lib/resources.js";
import {SCIMError} from "#@/lib/types/error.js";
import {Resource} from "#@/lib/types/resource.js";
import {ErrorResponse} from "#@/lib/messages/error.js";
import {User} from "#@/lib/resources/user.js";
import {Group} from "#@/lib/resources/group.js";
import {BulkRequest} from "#@/lib/messages/bulkrequest.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./bulkrequest.json"), "utf8").then((f) => JSON.parse(f));
// Default parameter values to use in tests
const params = {id: "urn:ietf:params:scim:api:messages:2.0:BulkRequest"};
const template = {schemas: [params.id], Operations: [{}, {}]};

/** 
 * BulkRequest Test Resource Class
 * Because BulkRequest needs a set of implemented resources to test against 
 */
class Test extends Resource {
    // Store some helpful things for the mock methods
    static #lastId = 0;
    static #instances = [];
    static reset() {
        Test.#lastId = 0;
        Test.#instances = [];
        return Test;
    }
    
    // Endpoint/basepath required by all Resource implementations
    static endpoint = "/Test";
    static basepath() {}
    
    // Mock write method that assigns IDs and stores in static instances array
    async write(instance) {
        if (instance?.shouldThrow) 
            throw new TypeError("Failing as requested");
        
        // Give the instance an ID and assign data to it
        const target = Object.assign(
            (!!this.id ? Test.#instances.find(i => i.id === this.id) : {id: String(++Test.#lastId)}),
            JSON.parse(JSON.stringify({...instance, schemas: undefined, meta: undefined}))
        );
        
        // Save the instance if necessary and return it
        if (!Test.#instances.includes(target)) Test.#instances.push(target);
        return {...target, meta: {location: `/Test/${target.id}`}};
    }
    
    // Mock dispose method that removes from static instances array  
    async dispose() {
        if (this.id) Test.#instances.splice(Test.#instances.indexOf(Test.#instances.find(i => i.id === this.id)), 1);
        else throw new SCIMError(404, null, "DELETE operation must target a specific resource");
    }
}

describe("SCIMMY.Messages.BulkRequest", () => {
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => sandbox.stub(Resources.default, "declared").returns([User, Group]));
    
    describe("@constructor", () => {
        it("should not instantiate requests with invalid schemas", () => {
            assert.throws(() => new BulkRequest({schemas: ["nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `BulkRequest request body messages must exclusively specify schema as '${params.id}'`},
                "BulkRequest instantiated with invalid 'schemas' property");
            assert.throws(() => new BulkRequest({schemas: [params.id, "nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `BulkRequest request body messages must exclusively specify schema as '${params.id}'`},
                "BulkRequest instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'Operations' attribute of 'request' argument to be an array", () => {
            assert.throws(() => new BulkRequest({schemas: template.schemas, Operations: "a string"}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "BulkRequest expected 'Operations' attribute of 'request' parameter to be an array"},
                "BulkRequest instantiated with invalid 'Operations' attribute value 'a string' of 'request' parameter");
        });
        
        it("should expect at least one bulk op in 'Operations' attribute of 'request' argument", () => {
            assert.throws(() => new BulkRequest({schemas: template.schemas}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "BulkRequest request body must contain 'Operations' attribute with at least one operation"},
                "BulkRequest instantiated without at least one patch op in 'Operations' attribute of 'request' parameter");
            assert.throws(() => new BulkRequest({schemas: template.schemas, Operations: []}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "BulkRequest request body must contain 'Operations' attribute with at least one operation"},
                "BulkRequest instantiated without at least one bulk op in 'Operations' attribute of 'request' parameter");
        });
        
        it("should expect 'failOnErrors' attribute of 'request' argument to be a positive integer, if specified", () => {
            const fixtures = [
                ["string value 'a string'", "a string"],
                ["boolean value 'false'", false],
                ["negative integer value '-1'", -1],
                ["complex value", {}]
            ];
            
            for (let [label, value] of fixtures) {
                assert.throws(() => new BulkRequest({...template, failOnErrors: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "BulkRequest expected 'failOnErrors' attribute of 'request' parameter to be a positive integer"},
                    `BulkRequest instantiated with invalid 'failOnErrors' attribute ${label} of 'request' parameter`);
            }
        });
        
        it("should expect 'maxOperations' argument to be a positive integer, if specified", () => {
            const fixtures = [
                ["string value 'a string'", "a string"],
                ["boolean value 'false'", false],
                ["negative integer value '-1'", -1],
                ["complex value", {}]
            ];
            
            for (let [label, value] of fixtures) {
                assert.throws(() => new BulkRequest({...template}, value),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "BulkRequest expected 'maxOperations' parameter to be a positive integer"},
                    `BulkRequest instantiated with invalid 'maxOperations' parameter ${label}`);
            }
        });
        
        it("should expect number of operations to not exceed 'maxOperations' argument", () => {
            assert.throws(() => new BulkRequest({...template}, 1),
                {name: "SCIMError", status: 413, scimType: null,
                    message: "Number of operations in BulkRequest exceeds maxOperations limit (1)"},
                "BulkRequest instantiated with number of operations exceeding 'maxOperations' parameter");
        });
    });
    
    describe("#apply()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new BulkRequest({...template})).apply === "function",
                "Instance method 'apply' was not implemented");
        });
        
        it("should expect 'resourceTypes' argument to be an array of Resource type classes", async () => {
            await assert.rejects(() => new BulkRequest({...template, failOnErrors: 1}).apply([{}]),
                {name: "TypeError", message: "Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of BulkRequest"},
                "Instance method 'apply' did not expect 'resourceTypes' parameter to be an array of Resource type classes");
        });
        
        it("should expect 'method' attribute to have a value for each operation", async () => {
            const actual = (await (new BulkRequest({...template, Operations: [{}, {path: "/Test"}, {method: ""}]})).apply())?.Operations;
            const expected = [{status: "400"}, {status: "400", location: "/Test"}, {status: "400", method: ""}].map((e, index) => ({...e, response: {
                ...new ErrorResponse(new SCIMError(400, "invalidSyntax", `Missing or empty 'method' string in BulkRequest operation #${index+1}`))
            }}));
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Instance method 'apply' did not expect 'method' attribute to be present for each operation");
        });
        
        it("should expect 'method' attribute to be a string for each operation", async () => {
            const fixtures = [
                ["boolean value 'false'", false],
                ["negative integer value '-1'", -1],
                ["complex value", {}]
            ];
            
            for (let [label, value] of fixtures) {
                const actual = (await (new BulkRequest({...template, Operations: [{method: value}]})).apply())?.Operations;
                const expected = [{status: "400", method: value, response: {
                    ...new ErrorResponse(new SCIMError(400, "invalidSyntax", "Expected 'method' to be a string in BulkRequest operation #1"))
                }}];
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    `Instance method 'apply' did not reject 'method' attribute ${label}`);
            }
        });
        
        it("should expect 'method' attribute to be one of POST, PUT, PATCH, or DELETE for each operation", async () => {
            const actual = (await (new BulkRequest({...template, Operations: [{method: "a string"}]})).apply())?.Operations;
            const expected = [{status: "400", method: "a string", response: {
                ...new ErrorResponse(new SCIMError(400, "invalidValue", "Invalid 'method' value 'a string' in BulkRequest operation #1"))
            }}];
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Instance method 'apply' did not reject invalid 'method' string value 'a string'");
        });
        
        it("should expect 'path' attribute to have a value for each operation", async () => {
            const actual = (await (new BulkRequest({...template, Operations: [{method: "POST"}, {method: "POST", path: ""}]})).apply())?.Operations;
            const expected = [{status: "400", method: "POST"}, {status: "400", method: "POST"}].map((e, index) => ({...e, response: {
                ...new ErrorResponse(new SCIMError(400, "invalidSyntax", `Missing or empty 'path' string in BulkRequest operation #${index+1}`))
            }}));
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Instance method 'apply' did not expect 'path' attribute to be present for each operation");
        });
        
        it("should expect 'path' attribute to be a string for each operation", async () => {
            const fixtures = [
                ["boolean value 'false'", false],
                ["negative integer value '-1'", -1],
                ["complex value", {}]
            ];
            
            for (let [label, value] of fixtures) {
                const actual = (await (new BulkRequest({...template, Operations: [{method: "POST", path: value}]})).apply())?.Operations;
                const expected = [{status: "400", method: "POST", response: {
                    ...new ErrorResponse(new SCIMError(400, "invalidSyntax", "Expected 'path' to be a string in BulkRequest operation #1"))
                }}];
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    `Instance method 'apply' did not reject 'path' attribute ${label}`);
            }
        });
        
        it("should expect 'path' attribute to refer to a valid resource type endpoint", async () => {
            const actual = (await (new BulkRequest({...template, Operations: [{method: "POST", path: "/Test"}]})).apply())?.Operations;
            const expected = [{status: "400", method: "POST", response: {
                ...new ErrorResponse(new SCIMError(400, "invalidValue", "Invalid 'path' value '/Test' in BulkRequest operation #1"))
            }}];
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Instance method 'apply' did not expect 'path' attribute to refer to a valid resource type endpoint");
        });
        
        it("should expect 'path' attribute not to specify a resource ID if 'method' is POST", async () => {
            const actual = (await (new BulkRequest({...template, Operations: [{method: "POST", path: "/Test/1", bulkId: "asdf"}]})).apply([Test]))?.Operations;
            const expected = [{status: "404", method: "POST", bulkId: "asdf", response: {
                ...new ErrorResponse(new SCIMError(404, null, "POST operation must not target a specific resource in BulkRequest operation #1"))
            }}];
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Instance method 'apply' did not expect 'path' attribute not to specify a resource ID when 'method' was POST");
        });
        
        it("should expect 'path' attribute to specify a resource ID if 'method' is not POST", async () => {
            const actual = (await (new BulkRequest({...template, Operations: [{method: "PUT", path: "/Test"}, {method: "DELETE", path: "/Test"}]})).apply([Test]))?.Operations;
            const expected = [{status: "404", method: "PUT", location: "/Test"}, {status: "404", method: "DELETE", location: "/Test"}].map((e, index) => ({...e, response: {
                ...new ErrorResponse(new SCIMError(404, null, `${e.method} operation must target a specific resource in BulkRequest operation #${index+1}`))
            }}));
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Instance method 'apply' did not expect 'path' attribute to specify a resource ID when 'method' was not POST");
        });
        
        it("should expect 'bulkId' attribute to have a value for each 'POST' operation", async () => {
            const actual = (await (new BulkRequest({...template, Operations: [{method: "POST", path: "/Test"}, {method: "POST", path: "/Test", bulkId: ""}]})).apply([Test]))?.Operations;
            const expected = [{status: "400", method: "POST"}, {status: "400", method: "POST", bulkId: ""}].map((e, index) => ({...e, response: {
                ...new ErrorResponse(new SCIMError(400, "invalidSyntax", `POST operation missing required 'bulkId' string in BulkRequest operation #${index+1}`))
            }}));
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Instance method 'apply' did not expect 'bulkId' attribute to be present for each 'POST' operation");
        });
        
        it("should expect 'bulkId' attribute to be a string for each 'POST' operation", async () => {
            const fixtures = [
                ["boolean value 'false'", false],
                ["negative integer value '-1'", -1],
                ["complex value", {}]
            ];
            
            for (let [label, value] of fixtures) {
                const actual = (await (new BulkRequest({...template, Operations: [{method: "POST", path: "/Test", bulkId: value}]})).apply([Test]))?.Operations;
                const expected = [{status: "400", method: "POST", response: {
                    ...new ErrorResponse(new SCIMError(400, "invalidValue", "POST operation expected 'bulkId' to be a string in BulkRequest operation #1"))
                }}];
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    `Instance method 'apply' did not reject 'path' attribute ${label}`);
            }
        });
        
        it("should expect 'data' attribute to have a value when 'method' is not DELETE", async () => {
            const actual = (await (new BulkRequest({...template, Operations: [{method: "POST", path: "/Test", bulkId: "asdf"}, {method: "PUT", path: "/Test/1"}, {method: "PATCH", path: "/Test/1"}]})).apply([Test]))?.Operations;
            const expected = [{status: "400", method: "POST", bulkId: "asdf"}, {status: "400", method: "PUT", location: "/Test/1"}, {status: "400", method: "PATCH", location: "/Test/1"}].map((e, index) => ({...e, response: {
                ...new ErrorResponse(new SCIMError(400, "invalidSyntax", `Expected 'data' to be a single complex value in BulkRequest operation #${index+1}`))
            }}));
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Instance method 'apply' did not expect 'data' attribute to be present when 'method' was not DELETE");
        });
        
        it("should expect 'data' attribute to be a single complex value when 'method' is not DELETE", async () => {
            const suite = [
                {method: "POST", path: "/Test", bulkId: "asdf"},
                {method: "PUT", path: "/Test/1"},
                {method: "PATCH", path: "/Test/1"}
            ];
            const fixtures = [
                ["string value 'a string'", "a string"],
                ["boolean value 'false'", false],
                ["negative integer value '-1'", -1]
            ];
            
            for (let op of suite) {
                for (let [label, value] of fixtures) {
                    const actual = (await (new BulkRequest({...template, Operations: [{...op, data: value}]})).apply([Test]))?.Operations;
                    const expected = [{status: "400", method: op.method, ...(op.method === "POST" ? {bulkId: op.bulkId} : {location: op.path}), response: {
                        ...new ErrorResponse(new SCIMError(400, "invalidSyntax", "Expected 'data' to be a single complex value in BulkRequest operation #1"))
                    }}];
                    
                    assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                        `Instance method 'apply' did not reject 'data' attribute ${label}`);
                }
            }
        });
        
        it("should stop processing operations when failOnErrors limit is reached", async () => {
            const {inbound: {failOnErrors: suite}} = await fixtures;
            
            assert.ok((await (new BulkRequest({...template, failOnErrors: 1})).apply())?.Operations?.length === 1,
                "Instance method 'apply' did not stop processing when failOnErrors limit reached");
            
            for (let fixture of suite) {
                const result = await (new BulkRequest({...template, ...fixture.source})).apply([Test.reset()]);
                
                assert.deepStrictEqual(result.Operations.map(r => r.status), fixture.target,
                    `Instance method 'apply' did not stop processing in inbound failOnErrors fixture #${suite.indexOf(fixture)+1}`);
            }
        });
        
        it("should resolve bulkId references that are out of order", async () => {
            const {inbound: {bulkId: {unordered: suite}}} = await fixtures;
            
            for (let fixture of suite) {
                const result = await (new BulkRequest({...template, ...fixture.source})).apply([Test.reset()]);
                
                assert.deepStrictEqual(result.Operations.map(r => r.status), fixture.target,
                    `Instance method 'apply' did not resolve references in inbound bulkId unordered fixture #${suite.indexOf(fixture)+1}`);
            }
        });
        
        it("should resolve bulkId references that are circular", async () => {
            const {inbound: {bulkId: {circular: suite}}} = await fixtures;
            
            for (let fixture of suite) {
                const result = await (new BulkRequest({...template, ...fixture.source})).apply([Test.reset()]);
                
                assert.deepStrictEqual(result.Operations.map(r => r.status), fixture.target,
                    `Instance method 'apply' did not resolve references in inbound bulkId circular fixture #${suite.indexOf(fixture)+1}`);
            }
        });
        
        it("should dispose of newly created resources when circular bulkId operations fail", async () => {
            // Stub the dispose method on the test class, so it can be spied on
            const stub = sandbox.stub();
            const TestStubbed = class extends Test.reset() {dispose = stub};
            // Prepare a list of operations that are circular and will fail
            const Operations = [["qwerty", {ref: "bulkId:asdfgh"}], ["asdfgh", {ref: "bulkId:qwerty", shouldThrow: true}]]
                .map(([bulkId, data]) => ({method: "POST", path: "/Test", bulkId, data}));
            
            await (new BulkRequest({...template, Operations})).apply([TestStubbed]);
            
            assert.ok(stub.calledOnce,
                "Instance method 'apply' did not dispose of newly created resource when circular bulkId operation failed");
        });
        
        it("should handle precondition failures in dependent bulk operations", async () => {
            // Prepare a list of operations where the referenced bulkId operation will fail 
            const Operations = [["qwerty", {ref: "bulkId:asdfgh"}], ["asdfgh", {shouldThrow: true}]]
                .map(([bulkId, data]) => ({method: "POST", path: "/Test", bulkId, data}));
            const actual = await (new BulkRequest({...template, Operations})).apply([Test.reset()]);
            // Prepare the expected outcomes including the precondition failure and intentional failure
            const failedRef = "Referenced POST operation with bulkId 'asdfgh' was not successful";
            const expected = [["qwerty", 412, null, failedRef], ["asdfgh", 400, "invalidValue", "Failing as requested"]]
                .map(([bulkId, status, type, reason]) => ([bulkId, String(status), {...new ErrorResponse(new SCIMError(status, type, reason))}]))
                .map(([bulkId, status, response]) => ({method: "POST", bulkId, status, response}));
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual.Operations)), expected,
                "Instance method 'apply' did not handle precondition failure in dependent bulk operation");
        });
        
        for (let [method, fn] of [["POST", "write"], ["PUT", "write"], ["PATCH", "patch"], ["DELETE", "dispose"]]) {
            it(`should call resource instance '${fn}' method when 'method' attribute value is ${method}`, async () => {
                // Stub the target resource instance method on the test class, so it can be spied on
                const stub = sandbox.stub().returns(method !== "DELETE" ? {id: 1} : undefined);
                const TestStubbed = class extends Test.reset() {[fn] = stub};
                // Prepare details for an operation that should call the target method
                const path = `/Test${method !== "POST" ? "/1" : ""}`;
                const bulkId = (method === "POST" ? "asdf" : undefined);
                const data = (method !== "DELETE" ? {calledWithMe: true} : undefined);
                const Operations = [{method, path, bulkId, data}];
                
                await (new BulkRequest({...template, Operations})).apply([TestStubbed]);
                
                assert.ok(method !== "DELETE" ? stub.calledWith(sinon.match.same(data)) : stub.calledOnce,
                    `Instance method 'apply' did not call resource instance '${fn}' method when 'method' attribute value was ${method}`);
            });
        }
    });
});