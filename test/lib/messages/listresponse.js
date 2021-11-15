import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";

export let ListResponseSuite = (SCIMMY) => {
    const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
    const fixtures = fs.readFile(path.join(basepath, "./listresponse.json"), "utf8").then((f) => JSON.parse(f));
    const params = {id: "urn:ietf:params:scim:api:messages:2.0:ListResponse"};
    const template = {schemas: [params.id], Resources: [], totalResults: 0, startIndex: 1, itemsPerPage: 20};
    
    it("should include static class 'ListResponse'", () => 
        assert.ok(!!SCIMMY.Messages.ListResponse, "Static class 'ListResponse' not defined"));
    
    describe("SCIMMY.Messages.ListResponse", () => {
        it("should not require arguments at instantiation", () => {
            assert.deepStrictEqual({...(new SCIMMY.Messages.ListResponse())}, template,
                "ListResponse did not instantiate with correct default properties");
        });
        
        it("should not accept requests with invalid schemas", () => {
            assert.throws(() => new SCIMMY.Messages.ListResponse({schemas: ["nonsense"]}),
                {name: "TypeError", message: "ListResponse request body messages must exclusively specify schema as 'urn:ietf:params:scim:api:messages:2.0:ListResponse'"},
                "ListResponse instantiated with invalid 'schemas' property");
            assert.throws(() => 
                new SCIMMY.Messages.ListResponse({schemas: [params.id, "nonsense"]}),
                {name: "TypeError", message: "ListResponse request body messages must exclusively specify schema as 'urn:ietf:params:scim:api:messages:2.0:ListResponse'"},
                "ListResponse instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'startIndex' parameter to be a positive integer", () => {
            for (let value of ["a string", -1, 1.5]) {
                assert.throws(() => new SCIMMY.Messages.ListResponse([], {startIndex: value}),
                    {name: "TypeError", message: "Expected 'startIndex' and 'itemsPerPage' parameters to be positive integers in ListResponse message constructor"},
                    `ListResponse instantiated with invalid 'startIndex' parameter value '${value}'`);
            }
        });
        
        it("should use 'startIndex' value included in inbound requests", async () => {
            let {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.ok((new SCIMMY.Messages.ListResponse(fixture, {startIndex: 20})).startIndex === fixture.startIndex, 
                    `ListResponse did not use 'startIndex' value included in inbound fixture #${suite.indexOf(fixture)+1}`);
            }
        });
        
        it("should expect 'itemsPerPage' parameter to be a positive integer", () => {
            for (let value of ["a string", -1, 1.5]) {
                assert.throws(() => new SCIMMY.Messages.ListResponse([], {itemsPerPage: value}),
                    {name: "TypeError", message: "Expected 'startIndex' and 'itemsPerPage' parameters to be positive integers in ListResponse message constructor"},
                    `ListResponse instantiated with invalid 'itemsPerPage' parameter value '${value}'`);
            }
        });
        
        it("should use 'itemsPerPage' value included in inbound requests", async () => {
            let {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.ok((new SCIMMY.Messages.ListResponse(fixture, {itemsPerPage: 200})).itemsPerPage === fixture.itemsPerPage,
                    `ListResponse did not use 'itemsPerPage' value included in inbound fixture #${suite.indexOf(fixture)+1}`);
            }
        });
        
        it("should expect 'sortBy' parameter to be a string", () => {
            assert.throws(() => new SCIMMY.Messages.ListResponse([], {sortBy: 1}),
                {name: "TypeError", message: "Expected 'sortBy' parameter to be a string in ListResponse message constructor"},
                "ListResponse instantiated with invalid 'sortBy' parameter value '1'");
            assert.throws(() => new SCIMMY.Messages.ListResponse([], {sortBy: {}}),
                {name: "TypeError", message: "Expected 'sortBy' parameter to be a string in ListResponse message constructor"},
                "ListResponse instantiated with invalid 'sortBy' parameter complex value");
        });
        
        it("should ignore 'sortOrder' parameter if 'sortBy' parameter is not defined", () => {
            assert.doesNotThrow(() => new SCIMMY.Messages.ListResponse([], {sortOrder: "a string"}), 
                "ListResponse did not ignore invalid 'sortOrder' parameter when 'sortBy' parameter was not defined");
        });
        
        it("should expect 'sortOrder' parameter to be either 'ascending' or 'descending' if 'sortBy' parameter is defined", () => {
            assert.throws(() => new SCIMMY.Messages.ListResponse([], {sortBy: "test", sortOrder: "a string"}),
                {name: "TypeError", message: "Expected 'sortOrder' parameter to be either 'ascending' or 'descending' in ListResponse message constructor"},
                "ListResponse accepted invalid 'sortOrder' parameter value 'a string'");
        });
        
        it("should have instance member 'Resources' that is an array", () => {
            let list = new SCIMMY.Messages.ListResponse();
            
            assert.ok("Resources" in list,
                "Instance member 'Resources' not defined");
            assert.ok(Array.isArray(list.Resources),
                "Instance member 'Resources' was not an array");
        });
        
        it("should have instance member 'totalResults' that is a non-negative integer", () => {
            let list = new SCIMMY.Messages.ListResponse();
            
            assert.ok("totalResults" in list,
                "Instance member 'totalResults' not defined");
            assert.ok(typeof list.totalResults === "number" && !Number.isNaN(list.totalResults),
                "Instance member 'totalResults' was not a number");
            assert.ok(list.totalResults >= 0 && Number.isInteger(list.totalResults),
                "Instance member 'totalResults' was not a non-negative integer");
        });
        
        it("should use 'totalResults' value included in inbound requests", async () => {
            let {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.ok((new SCIMMY.Messages.ListResponse(fixture, {totalResults: 200})).totalResults === fixture.totalResults,
                    `ListResponse did not use 'totalResults' value included in inbound fixture #${suite.indexOf(fixture)+1}`);
            }
        });
        
        for (let member of ["startIndex", "itemsPerPage"]) {
            it(`should have instance member '${member}' that is a positive integer`, () => {
                let list = new SCIMMY.Messages.ListResponse();
                
                assert.ok(member in list,
                    `Instance member '${member}' not defined`);
                assert.ok(typeof list[member] === "number" && !Number.isNaN(list[member]),
                    `Instance member '${member}' was not a number`);
                assert.ok(list[member] > 0 && Number.isInteger(list[member]),
                    `Instance member '${member}' was not a positive integer`);
            });
        }
        
        it("should only sort resources if 'sortBy' parameter is supplied", async () => {
            let {outbound: {source}} = await fixtures,
                list = new SCIMMY.Messages.ListResponse(source, {sortOrder: "descending"});
            
            for (let item of source) {
                assert.ok(item.id === list.Resources[source.indexOf(item)]?.id,
                    "ListResponse unexpectedly sorted resources when 'sortBy' parameter was not supplied");
            }
        });
        
        it("should correctly sort resources if 'sortBy' parameter is supplied", async () => {
            let {outbound: {source, targets: suite}} = await fixtures;
            
            for (let fixture of suite) {
                let list = new SCIMMY.Messages.ListResponse(source, {sortBy: fixture.sortBy, sortOrder: fixture.sortOrder});
                
                assert.deepStrictEqual(list.Resources.map(r => r.id), fixture.expected,
                    `ListResponse did not correctly sort outbound target #${suite.indexOf(fixture)+1} by 'sortBy' value '${fixture.sortBy}'`);
            }
        });
        
        it("should not include more resources than 'itemsPerPage' parameter", async () => {
            let {outbound: {source}} = await fixtures;
            
            for (let length of [2, 5, 10, 200, 1]) {
                assert.ok((new SCIMMY.Messages.ListResponse(source, {itemsPerPage: length})).Resources.length <= length,
                    "ListResponse included more resources than specified in 'itemsPerPage' parameter");
            }
        });
    });
}