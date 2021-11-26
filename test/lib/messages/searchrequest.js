import assert from "assert";

export let SearchRequestSuite = (SCIMMY) => {
    const params = {id: "urn:ietf:params:scim:api:messages:2.0:SearchRequest"};
    const template = {schemas: [params.id]};
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
    
    it("should include static class 'SearchRequest'", () =>
        assert.ok(!!SCIMMY.Messages.SearchRequest, "Static class 'SearchRequest' not defined"));
    
    describe("SCIMMY.Messages.SearchRequest", () => {
        it("should not require arguments at instantiation", () => {
            assert.deepStrictEqual({...(new SCIMMY.Messages.SearchRequest())}, template,
                "SearchRequest did not instantiate with correct default properties");
        });
        
        it("should not instantiate requests with invalid schemas", () => {
            assert.throws(() => new SCIMMY.Messages.SearchRequest({schemas: ["nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `SearchRequest request body messages must exclusively specify schema as '${params.id}'`},
                "SearchRequest instantiated with invalid 'schemas' property");
            assert.throws(() => new SCIMMY.Messages.SearchRequest({schemas: [params.id, "nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `SearchRequest request body messages must exclusively specify schema as '${params.id}'`},
                "SearchRequest instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'filter' property of 'request' argument to be a non-empty string, if specified", () => {
            assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest({...template, filter: "test"}),
                "SearchRequest did not instantiate with valid 'filter' property string value 'test'");
            
            for (let [label, value] of suites.strings) {
                assert.throws(() => new SCIMMY.Messages.SearchRequest({...template, filter: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'filter' parameter to be a non-empty string"},
                    `SearchRequest instantiated with invalid 'filter' property ${label}`);
            }
        });
        
        it("should expect 'excludedAttributes' property of 'request' argument to be an array of non-empty strings, if specified", () => {
            assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest({...template, excludedAttributes: ["test"]}),
                "SearchRequest did not instantiate with valid 'excludedAttributes' property non-empty string array value");
            
            for (let [label, value] of suites.arrays) {
                assert.throws(() => new SCIMMY.Messages.SearchRequest({...template, excludedAttributes: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'excludedAttributes' parameter to be an array of non-empty strings"},
                    `SearchRequest instantiated with invalid 'excludedAttributes' property ${label}`);
            }
        });
        
        it("should expect 'attributes' property of 'request' argument to be an array of non-empty strings, if specified", () => {
            assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest({...template, excludedAttributes: ["test"]}),
                "SearchRequest did not instantiate with valid 'excludedAttributes' property non-empty string array value");
            
            for (let [label, value] of suites.arrays) {
                assert.throws(() => new SCIMMY.Messages.SearchRequest({...template, excludedAttributes: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'excludedAttributes' parameter to be an array of non-empty strings"},
                    `SearchRequest instantiated with invalid 'excludedAttributes' property ${label}`);
            }
        });
        
        it("should expect 'sortBy' property of 'request' argument to be a non-empty string, if specified", () => {
            assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest({...template, sortBy: "test"}),
                "SearchRequest did not instantiate with valid 'sortBy' property string value 'test'");
            
            for (let [label, value] of suites.strings) {
                assert.throws(() => new SCIMMY.Messages.SearchRequest({...template, sortBy: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'sortBy' parameter to be a non-empty string"},
                    `SearchRequest instantiated with invalid 'sortBy' property ${label}`);
            }
        });
        
        it("should expect 'sortOrder' property of 'request' argument to be either 'ascending' or 'descending', if specified", () => {
            assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest({...template, sortOrder: "ascending"}),
                "SearchRequest did not instantiate with valid 'sortOrder' property string value 'ascending'");
            
            for (let [label, value] of suites.strings) {
                assert.throws(() => new SCIMMY.Messages.SearchRequest({...template, sortOrder: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'sortOrder' parameter to be either 'ascending' or 'descending'"},
                    `SearchRequest instantiated with invalid 'sortOrder' property ${label}`);
            }
        });
        
        it("should expect 'startIndex' property of 'request' argument to be a positive integer, if specified", () => {
            assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest({...template, startIndex: 1}),
                "SearchRequest did not instantiate with valid 'startIndex' property positive integer value '1'");
            
            for (let [label, value] of suites.numbers) {
                assert.throws(() => new SCIMMY.Messages.SearchRequest({...template, startIndex: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'startIndex' parameter to be a positive integer"},
                    `SearchRequest instantiated with invalid 'startIndex' property ${label}`);
            }
        });
        
        it("should expect 'count' property of 'request' argument to be a positive integer, if specified", () => {
            assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest({...template, count: 1}),
                "SearchRequest did not instantiate with valid 'count' property positive integer value '1'");
            
            for (let [label, value] of suites.numbers) {
                assert.throws(() => new SCIMMY.Messages.SearchRequest({...template, count: value}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Expected 'count' parameter to be a positive integer"},
                    `SearchRequest instantiated with invalid 'count' property ${label}`);
            }
        });
        
        describe("#prepare()", () => {
            it("should have instance method 'prepare'", () => {
                assert.ok(typeof (new SCIMMY.Messages.SearchRequest()).prepare === "function",
                    "Instance method 'prepare' not defined");
            });
            
            it("should return the same instance it was called from", () => {
                let expected = new SCIMMY.Messages.SearchRequest();
                
                assert.strictEqual(expected.prepare(), expected,
                    "Instance method 'prepare' did not return the same instance it was called from");
            });
            
            it("should expect 'filter' property of 'params' argument to be a non-empty string, if specified", () => {
                assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest().prepare({filter: "test"}),
                    "Instance method 'prepare' rejected valid 'filter' property string value 'test'");
                
                for (let [label, value] of suites.strings) {
                    assert.throws(() => new SCIMMY.Messages.SearchRequest().prepare({filter: value}),
                        {name: "TypeError", message: "Expected 'filter' parameter to be a non-empty string in 'prepare' method of SearchRequest"},
                        `Instance method 'prepare' did not reject invalid 'filter' property ${label}`);
                }
            });
            
            it("should expect 'excludedAttributes' property of 'params' argument to be an array of non-empty strings, if specified", () => {
                assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest().prepare({excludedAttributes: ["test"]}),
                    "Instance method 'prepare' rejected valid 'excludedAttributes' property non-empty string array value");
                
                for (let [label, value] of suites.arrays) {
                    assert.throws(() => new SCIMMY.Messages.SearchRequest().prepare({excludedAttributes: value}),
                        {name: "TypeError", message: "Expected 'excludedAttributes' parameter to be an array of non-empty strings in 'prepare' method of SearchRequest"},
                        `Instance method 'prepare' did not reject invalid 'excludedAttributes' property ${label}`);
                }
            });
            
            it("should expect 'attributes' property of 'request' params to be an array of non-empty strings, if specified", () => {
                assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest().prepare({attributes: ["test"]}),
                    "Instance method 'prepare' rejected valid 'attributes' property non-empty string array value");
                
                for (let [label, value] of suites.arrays) {
                    assert.throws(() => new SCIMMY.Messages.SearchRequest().prepare({attributes: value}),
                        {name: "TypeError", message: "Expected 'attributes' parameter to be an array of non-empty strings in 'prepare' method of SearchRequest"},
                        `Instance method 'prepare' did not reject invalid 'attributes' property ${label}`);
                }
            });
            
            it("should expect 'sortBy' property of 'params' argument to be a non-empty string, if specified", () => {
                assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest().prepare({sortBy: "test"}),
                    "Instance method 'prepare' rejected valid 'sortBy' property string value 'test'");
                
                for (let [label, value] of suites.strings) {
                    assert.throws(() => new SCIMMY.Messages.SearchRequest().prepare({sortBy: value}),
                        {name: "TypeError", message: "Expected 'sortBy' parameter to be a non-empty string in 'prepare' method of SearchRequest"},
                        `Instance method 'prepare' did not reject invalid 'sortBy' property ${label}`);
                }
            });
            
            it("should expect 'sortOrder' property of 'params' argument to be either 'ascending' or 'descending', if specified", () => {
                assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest().prepare({sortOrder: "ascending"}),
                    "Instance method 'prepare' rejected valid 'sortOrder' property string value 'ascending'");
                
                for (let [label, value] of suites.strings) {
                    assert.throws(() => new SCIMMY.Messages.SearchRequest().prepare({sortOrder: value}),
                        {name: "TypeError", message: "Expected 'sortOrder' parameter to be either 'ascending' or 'descending' in 'prepare' method of SearchRequest"},
                        `Instance method 'prepare' did not reject invalid 'sortOrder' property ${label}`);
                }
            });
            
            it("should expect 'startIndex' property of 'params' argument to be a positive integer, if specified", () => {
                assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest().prepare({startIndex: 1}),
                    "Instance method 'prepare' rejected valid 'startIndex' property positive integer value '1'");
                
                for (let [label, value] of suites.numbers) {
                    assert.throws(() => new SCIMMY.Messages.SearchRequest().prepare({startIndex: value}),
                        {name: "TypeError", message: "Expected 'startIndex' parameter to be a positive integer in 'prepare' method of SearchRequest"},
                        `Instance method 'prepare' did not reject invalid 'startIndex' property ${label}`);
                }
            });
            
            it("should expect 'count' property of 'params' argument to be a positive integer, if specified", () => {
                assert.doesNotThrow(() => new SCIMMY.Messages.SearchRequest().prepare({count: 1}),
                    "Instance method 'prepare' rejected valid 'count' property positive integer value '1'");
                
                for (let [label, value] of suites.numbers) {
                    assert.throws(() => new SCIMMY.Messages.SearchRequest().prepare({count: value}),
                        {name: "TypeError", message: "Expected 'count' parameter to be a positive integer in 'prepare' method of SearchRequest"},
                        `Instance method 'prepare' did not reject invalid 'count' property ${label}`);
                }
            });
        });
        
        describe("#apply()", () => {
            it("should have instance method 'apply'", () => {
                assert.ok(typeof (new SCIMMY.Messages.SearchRequest()).apply === "function",
                    "Instance method 'apply' not defined");
            });
        });
    });
}