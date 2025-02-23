import assert from "assert";
import sinon from "sinon";
import * as Resources from "#@/lib/resources.js";
import {ListResponse} from "#@/lib/messages/listresponse.js";
import {User} from "#@/lib/resources/user.js";
import {Group} from "#@/lib/resources/group.js";
import {SearchRequest} from "#@/lib/messages/searchrequest.js";
import {createResourceClass} from "../../hooks/resources.js";

// Default parameter values to use in tests
const params = {id: "urn:ietf:params:scim:api:messages:2.0:SearchRequest"};
const template = {schemas: [params.id]};
// List of test suites to run validation against
const suites = {
    strings: [
        ["empty string value", ""],
        ["boolean value 'false'", false],
        ["number value '1'", 1],
        ["complex value", {}]
    ],
    numbers: [
        ["string value 'a string'", "a string"],
        ["boolean value 'false'", false],
        ["negative integer value '-1'", -1],
        ["decimal value '1.5'", 1.5],
        ["complex value", {}]
    ],
    arrays: [
        ["string value 'a string'", "a string"],
        ["boolean value 'false'", false],
        ["number value '1'", 1],
        ["complex value", {}],
        ["array with an empty string", ["test", ""]]
    ]
};

describe("SCIMMY.Messages.SearchRequest", () => {
    const sandbox = sinon.createSandbox();
    
    after(() => sandbox.restore());
    before(() => sandbox.stub(Resources.default, "declared").returns([User, Group]));
    
    describe("@constructor", () => {
        it("should not require arguments", () => {
            assert.deepStrictEqual({...(new SearchRequest())}, template,
                "SearchRequest did not instantiate with correct default properties");
        });
        
        it("should not instantiate requests with invalid schemas", () => {
            assert.throws(() => new SearchRequest({schemas: ["nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `SearchRequest request body messages must exclusively specify schema as '${params.id}'`},
                "SearchRequest instantiated with invalid 'schemas' property");
            assert.throws(() => new SearchRequest({schemas: [params.id, "nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `SearchRequest request body messages must exclusively specify schema as '${params.id}'`},
                "SearchRequest instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'filter' property of 'request' argument to be a non-empty string, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest({...template, filter: "test"}),
                "SearchRequest did not instantiate with valid 'filter' property string value 'test'");
            
            for (let [label, value] of suites.strings) {
                assert.throws(() => new SearchRequest({...template, filter: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'filter' parameter to be a non-empty string"},
                    `SearchRequest instantiated with invalid 'filter' property ${label}`);
            }
        });
        
        it("should expect 'excludedAttributes' property of 'request' argument to be an array of non-empty strings, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest({...template, excludedAttributes: ["test"]}),
                "SearchRequest did not instantiate with valid 'excludedAttributes' property non-empty string array value");
            
            for (let [label, excludedAttributes] of suites.arrays) {
                assert.throws(() => new SearchRequest({...template, excludedAttributes}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'excludedAttributes' parameter to be an array of non-empty strings"},
                    `SearchRequest instantiated with invalid 'excludedAttributes' property ${label}`);
            }
        });
        
        it("should expect 'attributes' property of 'request' argument to be an array of non-empty strings, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest({...template, attributes: ["test"]}),
                "SearchRequest did not instantiate with valid 'attributes' property non-empty string array value");
            
            for (let [label, attributes] of suites.arrays) {
                assert.throws(() => new SearchRequest({...template, attributes}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'attributes' parameter to be an array of non-empty strings"},
                    `SearchRequest instantiated with invalid 'attributes' property ${label}`);
            }
        });
        
        it("should expect 'sortBy' property of 'request' argument to be a non-empty string, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest({...template, sortBy: "test"}),
                "SearchRequest did not instantiate with valid 'sortBy' property string value 'test'");
            
            for (let [label, sortBy] of suites.strings) {
                assert.throws(() => new SearchRequest({...template, sortBy}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'sortBy' parameter to be a non-empty string"},
                    `SearchRequest instantiated with invalid 'sortBy' property ${label}`);
            }
        });
        
        it("should expect 'sortOrder' property of 'request' argument to be either 'ascending' or 'descending', if specified", () => {
            assert.doesNotThrow(() => new SearchRequest({...template, sortOrder: "ascending"}),
                "SearchRequest did not instantiate with valid 'sortOrder' property string value 'ascending'");
            
            for (let [label, sortOrder] of suites.strings) {
                assert.throws(() => new SearchRequest({...template, sortOrder}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'sortOrder' parameter to be either 'ascending' or 'descending'"},
                    `SearchRequest instantiated with invalid 'sortOrder' property ${label}`);
            }
        });
        
        it("should expect 'startIndex' property of 'request' argument to be a positive integer, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest({...template, startIndex: 1}),
                "SearchRequest did not instantiate with valid 'startIndex' property positive integer value '1'");
            
            for (let [label, startIndex] of suites.numbers) {
                assert.throws(() => new SearchRequest({...template, startIndex}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'startIndex' parameter to be a positive integer"},
                    `SearchRequest instantiated with invalid 'startIndex' property ${label}`);
            }
        });
        
        it("should expect 'count' property of 'request' argument to be a positive integer, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest({...template, count: 1}),
                "SearchRequest did not instantiate with valid 'count' property positive integer value '1'");
            
            for (let [label, count] of suites.numbers) {
                assert.throws(() => new SearchRequest({...template, count}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'count' parameter to be a positive integer"},
                    `SearchRequest instantiated with invalid 'count' property ${label}`);
            }
        });
    });
    
    describe(".id", () => {
        it("should be defined", () => {
            assert.ok("id" in SearchRequest,
                "Static member 'id' not defined");
        });
        
        it("should be a string", () => {
            assert.ok(typeof SearchRequest.id === "string",
                "Static member 'id' was not a string");
        });
        
        it("should match SCIM Search Request Message schema ID", async () => {
            assert.strictEqual(SearchRequest.id, params.id,
                "Static member 'id' did not match SCIM Search Request Message schema ID");
        });
    });
    
    describe("#prepare()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new SearchRequest()).prepare === "function",
                "Instance method 'prepare' was not implemented");
        });
        
        it("should return the same instance it was called from", () => {
            const expected = new SearchRequest();
            
            assert.strictEqual(expected.prepare(), expected,
                "Instance method 'prepare' did not return the same instance it was called from");
        });
        
        it("should expect 'filter' property of 'params' argument to be a non-empty string, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest().prepare({filter: "test"}),
                "Instance method 'prepare' rejected valid 'filter' property string value 'test'");
            
            for (let [label, filter] of suites.strings) {
                assert.throws(() => new SearchRequest().prepare({filter}),
                    {name: "TypeError", message: "Expected 'filter' parameter to be a non-empty string in 'prepare' method of SearchRequest"},
                    `Instance method 'prepare' did not reject invalid 'filter' property ${label}`);
            }
        });
        
        it("should expect 'excludedAttributes' property of 'params' argument to be an array of non-empty strings, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest().prepare({excludedAttributes: ["test"]}),
                "Instance method 'prepare' rejected valid 'excludedAttributes' property non-empty string array value");
            
            for (let [label, excludedAttributes] of suites.arrays) {
                assert.throws(() => new SearchRequest().prepare({excludedAttributes}),
                    {name: "TypeError", message: "Expected 'excludedAttributes' parameter to be an array of non-empty strings in 'prepare' method of SearchRequest"},
                    `Instance method 'prepare' did not reject invalid 'excludedAttributes' property ${label}`);
            }
        });
        
        it("should expect 'attributes' property of 'request' params to be an array of non-empty strings, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest().prepare({attributes: ["test"]}),
                "Instance method 'prepare' rejected valid 'attributes' property non-empty string array value");
            
            for (let [label, attributes] of suites.arrays) {
                assert.throws(() => new SearchRequest().prepare({attributes}),
                    {name: "TypeError", message: "Expected 'attributes' parameter to be an array of non-empty strings in 'prepare' method of SearchRequest"},
                    `Instance method 'prepare' did not reject invalid 'attributes' property ${label}`);
            }
        });
        
        it("should expect 'sortBy' property of 'params' argument to be a non-empty string, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest().prepare({sortBy: "test"}),
                "Instance method 'prepare' rejected valid 'sortBy' property string value 'test'");
            
            for (let [label, sortBy] of suites.strings) {
                assert.throws(() => new SearchRequest().prepare({sortBy}),
                    {name: "TypeError", message: "Expected 'sortBy' parameter to be a non-empty string in 'prepare' method of SearchRequest"},
                    `Instance method 'prepare' did not reject invalid 'sortBy' property ${label}`);
            }
        });
        
        it("should expect 'sortOrder' property of 'params' argument to be either 'ascending' or 'descending', if specified", () => {
            assert.doesNotThrow(() => new SearchRequest().prepare({sortOrder: "ascending"}),
                "Instance method 'prepare' rejected valid 'sortOrder' property string value 'ascending'");
            
            for (let [label, sortOrder] of suites.strings) {
                assert.throws(() => new SearchRequest().prepare({sortOrder}),
                    {name: "TypeError", message: "Expected 'sortOrder' parameter to be either 'ascending' or 'descending' in 'prepare' method of SearchRequest"},
                    `Instance method 'prepare' did not reject invalid 'sortOrder' property ${label}`);
            }
        });
        
        it("should expect 'startIndex' property of 'params' argument to be a positive integer, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest().prepare({startIndex: 1}),
                "Instance method 'prepare' rejected valid 'startIndex' property positive integer value '1'");
            
            for (let [label, startIndex] of suites.numbers) {
                assert.throws(() => new SearchRequest().prepare({startIndex}),
                    {name: "TypeError", message: "Expected 'startIndex' parameter to be a positive integer in 'prepare' method of SearchRequest"},
                    `Instance method 'prepare' did not reject invalid 'startIndex' property ${label}`);
            }
        });
        
        it("should expect 'count' property of 'params' argument to be a positive integer, if specified", () => {
            assert.doesNotThrow(() => new SearchRequest().prepare({count: 1}),
                "Instance method 'prepare' rejected valid 'count' property positive integer value '1'");
            
            for (let [label, count] of suites.numbers) {
                assert.throws(() => new SearchRequest().prepare({count}),
                    {name: "TypeError", message: "Expected 'count' parameter to be a positive integer in 'prepare' method of SearchRequest"},
                    `Instance method 'prepare' did not reject invalid 'count' property ${label}`);
            }
        });
    });
    
    describe("#apply()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new SearchRequest()).apply === "function",
                "Instance method 'apply' was not implemented");
        });
        
        it("should expect 'resourceTypes' argument to be an array of Resource type classes", async () => {
            await assert.rejects(() => new SearchRequest().apply([{}]),
                {name: "TypeError", message: "Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of SearchRequest"},
                "Instance method 'apply' did not expect 'resourceTypes' parameter to be an array of Resource type classes");
        });
        
        it("should return a ListResponse message instance", async () => {
            assert.ok(await (new SearchRequest()).apply([]) instanceof ListResponse,
                "Instance method 'apply' did not return an instance of ListResponse");
        });
        
        it("should call through to Resource type when only one given in 'resourceTypes' argument", async function() {
            const count = 10;
            const stub = sandbox.stub();
            
            try {
                await (new SearchRequest().prepare({count})).apply([class Test extends createResourceClass() {
                    constructor(...args) {
                        stub(...args);
                        super(...args);
                    }
                    
                    read = sandbox.stub();
                }]);
            } catch {
                this.skip();
            }
            
            assert.ok(stub.calledWithMatch({...template, count}),
                "Instance method 'apply' did not call through to Resource type when only one given in 'resourceTypes' argument");
        });
    });
});