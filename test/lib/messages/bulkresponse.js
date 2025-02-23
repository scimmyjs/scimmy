import assert from "assert";
import {BulkResponse} from "#@/lib/messages/bulkresponse.js";

// Default parameter values to use in tests
const params = {id: "urn:ietf:params:scim:api:messages:2.0:BulkResponse"};
const template = {schemas: [params.id], Operations: []};

describe("SCIMMY.Messages.BulkResponse", () => {
    describe("@constructor", () => {
        it("should not require arguments", () => {
            assert.deepStrictEqual({...(new BulkResponse())}, template,
                "BulkResponse did not instantiate with correct default properties");
        });
        
        it("should not instantiate requests with invalid schemas", () => {
            assert.throws(() => new BulkResponse({schemas: ["nonsense"]}),
                {name: "TypeError", message: `BulkResponse request body messages must exclusively specify schema as '${params.id}'`},
                "BulkResponse instantiated with invalid 'schemas' property");
            assert.throws(() => new BulkResponse({schemas: [params.id, "nonsense"]}),
                {name: "TypeError", message: `BulkResponse request body messages must exclusively specify schema as '${params.id}'`},
                "BulkResponse instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'Operations' attribute of 'request' argument to be an array", () => {
            assert.throws(() => new BulkResponse({schemas: template.schemas, Operations: "a string"}),
                {name: "TypeError", message: "BulkResponse constructor expected 'Operations' property of 'request' parameter to be an array"},
                "BulkResponse instantiated with invalid 'Operations' attribute value 'a string' of 'request' parameter");
        });
    });
    
    describe(".id", () => {
        it("should be defined", () => {
            assert.ok("id" in BulkResponse,
                "Static member 'id' not defined");
        });
        
        it("should be a string", () => {
            assert.ok(typeof BulkResponse.id === "string",
                "Static member 'id' was not a string");
        });
        
        it("should match SCIM Bulk Response Message schema ID", async () => {
            assert.strictEqual(BulkResponse.id, params.id,
                "Static member 'id' did not match SCIM Bulk Response Message schema ID");
        });
    });
    
    describe("#resolve()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new BulkResponse()).resolve === "function",
                "Instance method 'resolve' was not implemented");
        });
        
        it("should return an instance of native Map class", () => {
            assert.ok((new BulkResponse().resolve()) instanceof Map,
                "Instance method 'resolve' did not return a map");
        });
    });
});