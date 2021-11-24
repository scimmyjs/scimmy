import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";

export let BulkRequestSuite = (SCIMMY) => {
    const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
    const fixtures = fs.readFile(path.join(basepath, "./bulkrequest.json"), "utf8").then((f) => JSON.parse(f));
    const params = {id: "urn:ietf:params:scim:api:messages:2.0:BulkRequest"};
    const template = {schemas: [params.id], Operations: [{}, {}]};
    
    /** 
     * BulkRequest Test Resource Class
     * Because BulkRequest needs a set of implemented resources to test against 
     */
    class Test extends SCIMMY.Types.Resource {
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
            // Give the instance an ID and assign data to it
            let target = Object.assign((!!this.id ? Test.#instances.find(i => i.id === this.id) : {id: String(++Test.#lastId)}),
                JSON.parse(JSON.stringify({...instance, schemas: undefined, meta: undefined})));
            
            // Save the instance if necessary and return it
            if (!Test.#instances.includes(target)) Test.#instances.push(target);
            return {...target, meta: {location: `/Test/${target.id}`}};
        }
        
        // Mock dispose method that removes from static instances array  
        async dispose() {
            if (this.id) Test.#instances.splice(Test.#instances.indexOf(Test.#instances.find(i => i.id === this.id)), 1);
            else throw new SCIMMY.Types.Error(404, null, "DELETE operation must target a specific resource");
        }
    }
    
    it("should include static class 'BulkRequest'", () => 
        assert.ok(!!SCIMMY.Messages.BulkRequest, "Static class 'BulkRequest' not defined"));
    
    describe("SCIMMY.Messages.BulkRequest", () => {
        it("should not instantiate requests with invalid schemas", () => {
            assert.throws(() => new SCIMMY.Messages.BulkRequest({schemas: ["nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `BulkRequest request body messages must exclusively specify schema as '${params.id}'`},
                "BulkRequest instantiated with invalid 'schemas' property");
            assert.throws(() => new SCIMMY.Messages.BulkRequest({schemas: [params.id, "nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `BulkRequest request body messages must exclusively specify schema as '${params.id}'`},
                "BulkRequest instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'Operations' attribute of 'request' argument to be an array", () => {
            assert.throws(() => new SCIMMY.Messages.BulkRequest({schemas: template.schemas, Operations: "a string"}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "BulkRequest expected 'Operations' attribute of 'request' parameter to be an array"},
                "BulkRequest instantiated with invalid 'Operations' attribute value 'a string' of 'request' parameter");
        });
        
        it("should expect at least one bulk op in 'Operations' attribute of 'request' argument", () => {
            assert.throws(() => new SCIMMY.Messages.BulkRequest({schemas: template.schemas}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "BulkRequest request body must contain 'Operations' attribute with at least one operation"},
                "BulkRequest instantiated without at least one patch op in 'Operations' attribute of 'request' parameter");
            assert.throws(() => new SCIMMY.Messages.BulkRequest({schemas: template.schemas, Operations: []}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "BulkRequest request body must contain 'Operations' attribute with at least one operation"},
                "BulkRequest instantiated without at least one bulk op in 'Operations' attribute of 'request' parameter");
        });
        
        it("should expect 'failOnErrors' attribute of 'request' argument to be a positive integer, if specified", () => {
            let fixtures = [
                ["string value 'a string'", "a string"],
                ["boolean value 'false'", false],
                ["negative integer value '-1'", -1],
                ["complex value", {}]
            ];
            
            for (let [label, value] of fixtures) {
                assert.throws(() => new SCIMMY.Messages.BulkRequest({...template, failOnErrors: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "BulkRequest expected 'failOnErrors' attribute of 'request' parameter to be a positive integer"},
                    `BulkRequest instantiated with invalid 'failOnErrors' attribute ${label} of 'request' parameter`);
            }
        });
        
        it("should expect 'maxOperations' argument to be a positive integer, if specified", () => {
            let fixtures = [
                ["string value 'a string'", "a string"],
                ["boolean value 'false'", false],
                ["negative integer value '-1'", -1],
                ["complex value", {}]
            ];
            
            for (let [label, value] of fixtures) {
                assert.throws(() => new SCIMMY.Messages.BulkRequest({...template}, value),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "BulkRequest expected 'maxOperations' parameter to be a positive integer"},
                    `BulkRequest instantiated with invalid 'maxOperations' parameter ${label}`);
            }
        });
        
        it("should expect number of operations to not exceed 'maxOperations' argument", () => {
            assert.throws(() => new SCIMMY.Messages.BulkRequest({...template}, 1),
                {name: "SCIMError", status: 413, scimType: null,
                    message: "Number of operations in BulkRequest exceeds maxOperations limit (1)"},
                "BulkRequest instantiated with number of operations exceeding 'maxOperations' parameter");
        });
        
        describe("#apply()", () => {
            it("should have instance method 'apply'", () => {
                assert.ok(typeof (new SCIMMY.Messages.BulkRequest({...template})).apply === "function",
                    "Instance method 'apply' not defined");
            });
            
            it("should expect 'resourceTypes' argument to be an array of Resource type classes", async () => {
                await assert.rejects(() => new SCIMMY.Messages.BulkRequest({...template, failOnErrors: 1}).apply([{}]),
                    {name: "TypeError", message: "Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of BulkRequest"},
                    "Instance method 'apply' did not expect 'resourceTypes' parameter to be an array of Resource type classes");
            });
            
            it("should expect 'method' attribute to have a value for each operation", async () => {
                let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{}, {path: "/Test"}, {method: ""}]})).apply())?.Operations,
                    expected = [{status: "400"}, {status: "400", location: "/Test"}, {status: "400", method: ""}].map((e, index) => ({...e, response: {
                        ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(400, "invalidSyntax", `Missing or empty 'method' string in BulkRequest operation #${index+1}`))
                    }}));
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    "Instance method 'apply' did not expect 'method' attribute to be present for each operation");
            });
            
            it("should expect 'method' attribute to be a string for each operation", async () => {
                let fixtures = [
                    ["boolean value 'false'", false],
                    ["negative integer value '-1'", -1],
                    ["complex value", {}]
                ];
                
                for (let [label, value] of fixtures) {
                    let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: value}]})).apply())?.Operations,
                        expected = [{status: "400", method: value, response: {
                            ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(
                                400, "invalidSyntax", "Expected 'method' to be a string in BulkRequest operation #1"))
                        }}];
                    
                    assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                        `Instance method 'apply' did not reject 'method' attribute ${label}`);
                }
            });
            
            it("should expect 'method' attribute to be one of POST, PUT, PATCH, or DELETE for each operation", async () => {
                let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: "a string"}]})).apply())?.Operations,
                    expected = [{status: "400", method: "a string", response: {
                        ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(400, "invalidValue", "Invalid 'method' value 'a string' in BulkRequest operation #1"))
                    }}];
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    "Instance method 'apply' did not reject invalid 'method' string value 'a string'");
            });
            
            it("should expect 'path' attribute to have a value for each operation", async () => {
                let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: "POST"}, {method: "POST", path: ""}]})).apply())?.Operations,
                    expected = [{status: "400", method: "POST"}, {status: "400", method: "POST"}].map((e, index) => ({...e, response: {
                        ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(400, "invalidSyntax", `Missing or empty 'path' string in BulkRequest operation #${index+1}`))
                    }}));
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    "Instance method 'apply' did not expect 'path' attribute to be present for each operation");
            });
            
            it("should expect 'path' attribute to be a string for each operation", async () => {
                let fixtures = [
                    ["boolean value 'false'", false],
                    ["negative integer value '-1'", -1],
                    ["complex value", {}]
                ];
                
                for (let [label, value] of fixtures) {
                    let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: "POST", path: value}]})).apply())?.Operations,
                        expected = [{status: "400", method: "POST", response: {
                            ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(
                                400, "invalidSyntax", "Expected 'path' to be a string in BulkRequest operation #1"))
                        }}];
                    
                    assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                        `Instance method 'apply' did not reject 'path' attribute ${label}`);
                }
            });
            
            it("should expect 'path' attribute to refer to a valid resource type endpoint", async () => {
                let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: "POST", path: "/Test"}]})).apply())?.Operations,
                    expected = [{status: "400", method: "POST", response: {
                        ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(400, "invalidValue", "Invalid 'path' value '/Test' in BulkRequest operation #1"))
                    }}];
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    "Instance method 'apply' did not expect 'path' attribute to refer to a valid resource type endpoint");
            });
            
            it("should expect 'path' attribute to NOT specify a resource ID if 'method' is POST", async () => {
                let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: "POST", path: "/Test/1", bulkId: "asdf"}]})).apply([Test]))?.Operations,
                    expected = [{status: "404", method: "POST", bulkId: "asdf", response: {
                        ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(404, null, "POST operation must not target a specific resource in BulkRequest operation #1"))
                    }}];
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    "Instance method 'apply' did not expect 'path' attribute not to specify a resource ID when 'method' was POST");
            });
            
            it("should expect 'path' attribute to specify a resource ID if 'method' is not POST", async () => {
                let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: "PUT", path: "/Test"}, {method: "DELETE", path: "/Test"}]})).apply([Test]))?.Operations,
                    expected = [{status: "404", method: "PUT", location: "/Test"}, {status: "404", method: "DELETE", location: "/Test"}].map((e, index) => ({...e, response: {
                        ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(404, null, `${e.method} operation must target a specific resource in BulkRequest operation #${index+1}`))
                    }}));
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    "Instance method 'apply' did not expect 'path' attribute to specify a resource ID when 'method' was not POST");
            });
            
            it("should expect 'bulkId' attribute to have a value for each 'POST' operation", async () => {
                let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: "POST", path: "/Test"}, {method: "POST", path: "/Test", bulkId: ""}]})).apply([Test]))?.Operations,
                    expected = [{status: "400", method: "POST"}, {status: "400", method: "POST", bulkId: ""}].map((e, index) => ({...e, response: {
                        ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(400, "invalidSyntax", `POST operation missing required 'bulkId' string in BulkRequest operation #${index+1}`))
                    }}));
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    "Instance method 'apply' did not expect 'bulkId' attribute to be present for each 'POST' operation");
            });
            
            it("should expect 'bulkId' attribute to be a string for each 'POST' operation", async () => {
                let fixtures = [
                    ["boolean value 'false'", false],
                    ["negative integer value '-1'", -1],
                    ["complex value", {}]
                ];
                
                for (let [label, value] of fixtures) {
                    let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: "POST", path: "/Test", bulkId: value}]})).apply([Test]))?.Operations,
                        expected = [{status: "400", method: "POST", response: {
                            ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(
                                400, "invalidValue", "POST operation expected 'bulkId' to be a string in BulkRequest operation #1"))
                        }}];
                    
                    assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                        `Instance method 'apply' did not reject 'path' attribute ${label}`);
                }
            });
            
            it("should expect 'data' attribute to have a value when 'method' is not DELETE", async () => {
                let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{method: "POST", path: "/Test", bulkId: "asdf"}, {method: "PUT", path: "/Test/1"}, {method: "PATCH", path: "/Test/1"}]})).apply([Test]))?.Operations,
                    expected = [{status: "400", method: "POST", bulkId: "asdf"}, {status: "400", method: "PUT", location: "/Test/1"}, {status: "400", method: "PATCH", location: "/Test/1"}].map((e, index) => ({...e, response: {
                        ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(400, "invalidSyntax", `Expected 'data' to be a single complex value in BulkRequest operation #${index+1}`))
                    }}));
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                    "Instance method 'apply' did not expect 'data' attribute to be present when 'method' was not DELETE");
            });
            
            it("should expect 'data' attribute to be a single complex value when 'method' is not DELETE", async () => {
                let suite = [
                        {method: "POST", path: "/Test", bulkId: "asdf"},
                        {method: "PUT", path: "/Test/1"},
                        {method: "PATCH", path: "/Test/1"}
                    ],
                    fixtures = [
                        ["string value 'a string'", "a string"],
                        ["boolean value 'false'", false],
                        ["negative integer value '-1'", -1]
                    ];
                
                for (let op of suite) {
                    for (let [label, value] of fixtures) {
                        let actual = (await (new SCIMMY.Messages.BulkRequest({...template, Operations: [{...op, data: value}]})).apply([Test]))?.Operations,
                            expected = [{status: "400", method: op.method, ...(op.method === "POST" ? {bulkId: op.bulkId} : {location: op.path}), response: {
                                ...new SCIMMY.Messages.Error(new SCIMMY.Types.Error(
                                    400, "invalidSyntax", "Expected 'data' to be a single complex value in BulkRequest operation #1"))
                            }}];
                        
                        assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                            `Instance method 'apply' did not reject 'data' attribute ${label}`);
                    }
                }
            });
            
            it("should stop processing operations when failOnErrors limit is reached", async () => {
                let {inbound: {failOnErrors: suite}} = await fixtures;
                
                assert.ok((await (new SCIMMY.Messages.BulkRequest({...template, failOnErrors: 1})).apply())?.Operations?.length === 1,
                    "Instance method 'apply' did not stop processing when failOnErrors limit reached");
                
                for (let fixture of suite) {
                    let result = await (new SCIMMY.Messages.BulkRequest({...template, ...fixture.source})).apply([Test.reset()]);
                    
                    assert.deepStrictEqual(result.Operations.map(r => r.status), fixture.target,
                        `Instance method 'apply' did not stop processing in inbound failOnErrors fixture #${suite.indexOf(fixture)+1}`);
                }
            });
            
            it("should resolve bulkId references that are out of order", async () => {
                let {inbound: {bulkId: {unordered: suite}}} = await fixtures;
                
                for (let fixture of suite) {
                    let result = await (new SCIMMY.Messages.BulkRequest({...template, ...fixture.source})).apply([Test.reset()]);
                    
                    assert.deepStrictEqual(result.Operations.map(r => r.status), fixture.target,
                        `Instance method 'apply' did not resolve references in inbound bulkId unordered fixture #${suite.indexOf(fixture)+1}`);
                }
            });
            
            it("should resolve bulkId references that are circular", async () => {
                let {inbound: {bulkId: {circular: suite}}} = await fixtures;
                
                for (let fixture of suite) {
                    let result = await (new SCIMMY.Messages.BulkRequest({...template, ...fixture.source})).apply([Test.reset()]);
                    
                    assert.deepStrictEqual(result.Operations.map(r => r.status), fixture.target,
                        `Instance method 'apply' did not resolve references in inbound bulkId circular fixture #${suite.indexOf(fixture)+1}`);
                }
            });
        });
    });
}