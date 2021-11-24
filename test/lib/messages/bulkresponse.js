import assert from "assert";

export let BulkResponseSuite = (SCIMMY) => {
    const params = {id: "urn:ietf:params:scim:api:messages:2.0:BulkResponse"};
    const template = {schemas: [params.id], Operations: [{}, {}]};
    
    it("should include static class 'BulkResponse'", () => 
        assert.ok(!!SCIMMY.Messages.BulkResponse, "Static class 'BulkResponse' not defined"));
    
    describe("SCIMMY.Messages.BulkResponse", () => {
        it("should not instantiate requests with invalid schemas", () => {
            assert.throws(() => new SCIMMY.Messages.BulkResponse({schemas: ["nonsense"]}),
                {name: "TypeError", message: `BulkResponse request body messages must exclusively specify schema as '${params.id}'`},
                "BulkResponse instantiated with invalid 'schemas' property");
            assert.throws(() => new SCIMMY.Messages.BulkResponse({schemas: [params.id, "nonsense"]}),
                {name: "TypeError", message: `BulkResponse request body messages must exclusively specify schema as '${params.id}'`},
                "BulkResponse instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'Operations' attribute of 'request' argument to be an array", () => {
            assert.throws(() => new SCIMMY.Messages.BulkResponse({schemas: template.schemas, Operations: "a string"}),
                {name: "TypeError", message: "Expected 'Operations' property of 'request' parameter to be an array in BulkResponse constructor"},
                "BulkResponse instantiated with invalid 'Operations' attribute value 'a string' of 'request' parameter");
        });
    });
}