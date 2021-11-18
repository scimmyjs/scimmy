import assert from "assert";

export let BulkOpSuite = (SCIMMY) => {
    const params = {id: "urn:ietf:params:scim:api:messages:2.0:BulkRequest"};
    const template = {schemas: [params.id], Operations: [{}, {}]};
    
    it("should include static class 'BulkOp'", () => 
        assert.ok(!!SCIMMY.Messages.BulkOp, "Static class 'BulkOp' not defined"));
    
    describe("SCIMMY.Messages.BulkOp", () => {
        it("should not instantiate requests with invalid schemas", () => {
            assert.throws(() => new SCIMMY.Messages.BulkOp({schemas: ["nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `BulkRequest request body messages must exclusively specify schema as '${params.id}'`},
                "BulkOp instantiated with invalid 'schemas' property");
            assert.throws(() => new SCIMMY.Messages.BulkOp({schemas: [params.id, "nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `BulkRequest request body messages must exclusively specify schema as '${params.id}'`},
                "BulkOp instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'Operations' attribute of 'request' argument to be an array", () => {
            assert.throws(() => new SCIMMY.Messages.BulkOp({schemas: template.schemas, Operations: "a string"}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "BulkRequest expected 'Operations' attribute of 'request' parameter to be an array"},
                "BulkOp instantiated with invalid 'Operations' attribute value 'a string' of 'request' parameter");
        });
        
        it("should expect at least one bulk op in 'Operations' attribute of 'request' argument", () => {
            assert.throws(() => new SCIMMY.Messages.BulkOp({schemas: template.schemas}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "BulkRequest request body must contain 'Operations' attribute with at least one operation"},
                "BulkOp instantiated without at least one patch op in 'Operations' attribute of 'request' parameter");
            assert.throws(() => new SCIMMY.Messages.BulkOp({schemas: template.schemas, Operations: []}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "BulkRequest request body must contain 'Operations' attribute with at least one operation"},
                "BulkOp instantiated without at least one bulk op in 'Operations' attribute of 'request' parameter");
        });
        
        it("should expect 'failOnErrors' attribute of 'request' argument to be a positive integer, if specified", () => {
            let fixtures = [
                ["string value 'a string'", "a string"],
                ["boolean value 'false'", false],
                ["negative integer value '-1'", -1],
                ["complex value", {}]
            ];
            
            for (let [label, value] of fixtures) {
                assert.throws(() => new SCIMMY.Messages.BulkOp({...template, failOnErrors: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "BulkRequest expected 'failOnErrors' attribute of 'request' parameter to be a positive integer"},
                    `BulkOp instantiated with invalid 'failOnErrors' attribute ${label} of 'request' parameter`);
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
                assert.throws(() => new SCIMMY.Messages.BulkOp({...template}, value),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "BulkRequest expected 'maxOperations' parameter to be a positive integer"},
                    `BulkOp instantiated with invalid 'maxOperations' parameter ${label}`);
            }
        });
        
        it("should expect number of operations to not exceed 'maxOperations' argument", () => {
            assert.throws(() => new SCIMMY.Messages.BulkOp({...template}, 1),
                {name: "SCIMError", status: 413, scimType: null,
                    message: "Number of operations in BulkRequest exceeds maxOperations limit (1)"},
                "BulkOp instantiated with number of operations exceeding 'maxOperations' parameter");
        });
        
        describe("#apply()", () => {
            it("should have instance method 'apply'", () => {
                assert.ok(typeof (new SCIMMY.Messages.BulkOp({...template})).apply === "function",
                    "Instance method 'apply' not defined");
            });
            
            it("should expect 'resourceTypes' argument to be an array of Resource type classes", async () => {
                await assert.rejects(() => new SCIMMY.Messages.BulkOp({...template, failOnErrors: 1}).apply([{}]),
                    {name: "TypeError", message: "Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of BulkOp"},
                    "Instance method 'apply' did not expect 'resourceTypes' parameter to be an array of Resource type classes");
            });
            
            it("should stop processing operations when failOnErrors limit is reached", async () => {
                assert.ok((await (new SCIMMY.Messages.BulkOp({...template, failOnErrors: 1})).apply())?.Operations?.length === 1,
                    "Instance method 'apply' did not stop processing when failOnErrors limit reached");
            });
        });
    });
}