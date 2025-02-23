import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import {ListResponse} from "#@/lib/messages/listresponse.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./listresponse.json"), "utf8").then((f) => JSON.parse(f));
// Default parameter values to use in tests
const params = {id: "urn:ietf:params:scim:api:messages:2.0:ListResponse"};
const template = {schemas: [params.id], Resources: [], totalResults: 0, startIndex: 1, itemsPerPage: 20};

describe("SCIMMY.Messages.ListResponse", () => {
    describe("@constructor", () => {
        it("should not require arguments", () => {
            assert.deepStrictEqual({...(new ListResponse())}, template,
                "ListResponse did not instantiate with correct default properties");
        });
        
        it("should not accept requests with invalid schemas", () => {
            assert.throws(() => new ListResponse({schemas: ["nonsense"]}),
                {name: "TypeError", message: "ListResponse request body messages must exclusively specify schema as 'urn:ietf:params:scim:api:messages:2.0:ListResponse'"},
                "ListResponse instantiated with invalid 'schemas' property");
            assert.throws(() => 
                new ListResponse({schemas: [params.id, "nonsense"]}),
                {name: "TypeError", message: "ListResponse request body messages must exclusively specify schema as 'urn:ietf:params:scim:api:messages:2.0:ListResponse'"},
                "ListResponse instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'startIndex' parameter to be a number", () => {
            for (let value of ["a string", false, {}]) {
                assert.throws(() => new ListResponse([], {startIndex: value}),
                    {name: "TypeError", message: "Expected 'startIndex' parameter to be a positive integer in ListResponse message constructor"},
                    `ListResponse instantiated with invalid 'startIndex' parameter value '${value}'`);
            }
        });
        
        it("should expect 'itemsPerPage' parameter to be a number", () => {
            for (let value of ["a string", false, {}, "1"]) {
                assert.throws(() => new ListResponse([], {itemsPerPage: value}),
                    {name: "TypeError", message: "Expected 'itemsPerPage' parameter to be a non-negative integer in ListResponse message constructor"},
                    `ListResponse instantiated with invalid 'itemsPerPage' parameter value '${value}'`);
            }
        });
        
        it("should expect 'totalResults' parameter to be a number", () => {
            for (let value of ["a string", false, {}, "1"]) {
                assert.throws(() => new ListResponse([], {totalResults: value}),
                    {name: "TypeError", message: "Expected 'totalResults' parameter to be a non-negative integer in ListResponse message constructor"},
                    `ListResponse instantiated with invalid 'totalResults' parameter value '${value}'`);
            }
        });
        
        it("should expect 'sortBy' parameter to be a string", () => {
            assert.throws(() => new ListResponse([], {sortBy: 1}),
                {name: "TypeError", message: "Expected 'sortBy' parameter to be a string in ListResponse message constructor"},
                "ListResponse instantiated with invalid 'sortBy' parameter value '1'");
            assert.throws(() => new ListResponse([], {sortBy: {}}),
                {name: "TypeError", message: "Expected 'sortBy' parameter to be a string in ListResponse message constructor"},
                "ListResponse instantiated with invalid 'sortBy' parameter complex value");
        });
        
        it("should ignore 'sortOrder' parameter if 'sortBy' parameter is not defined", () => {
            try {
                new ListResponse([], {sortOrder: "a string"});
            } catch (ex) {
                assert.fail(`ListResponse did not ignore invalid 'sortOrder' parameter when 'sortBy' parameter was not defined\r\n[cause]: ${ex}`);
            }
        });
        
        it("should expect 'sortOrder' parameter to be either 'ascending' or 'descending' if 'sortBy' parameter is defined", () => {
            assert.throws(() => new ListResponse([], {sortBy: "test", sortOrder: "a string"}),
                {name: "TypeError", message: "Expected 'sortOrder' parameter to be either 'ascending' or 'descending' in ListResponse message constructor"},
                "ListResponse accepted invalid 'sortOrder' parameter value 'a string'");
        });
        
        it("should only sort resources if 'sortBy' parameter is supplied", async () => {
            const {outbound: {source}} = await fixtures;
            const list = new ListResponse(source, {sortOrder: "descending"});
            
            assert.deepStrictEqual(list.Resources, source,
                "ListResponse unexpectedly sorted resources when 'sortBy' parameter was not supplied");
        });
        
        it("should correctly sort resources if 'sortBy' parameter is supplied", async () => {
            const {outbound: {source, targets: {sortBy: suite}}} = await fixtures;
            
            for (let fixture of suite) {
                const {expected, sortBy, sortOrder} = fixture;
                const actual = new ListResponse(source, {sortBy, sortOrder});
                
                assert.deepStrictEqual(actual.Resources.map(({id}) => id), expected,
                    `ListResponse did not correctly sort outbound sortBy target #${suite.indexOf(fixture)+1} by 'sortBy' value '${sortBy}'`);
            }
        });
    });
    
    describe("#Resources", () => {
        it("should be defined", () => {
            assert.ok("Resources" in new ListResponse(),
                "Instance member 'Resources' was not defined");
        });
        
        it("should be an array", () => {
            assert.ok(Array.isArray(new ListResponse().Resources),
                "Instance member 'Resources' was not an array");
        });
        
        it("should equal 'Resources' value included in inbound messages", async () => {
            const {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.deepStrictEqual(new ListResponse(fixture, {sortBy: "id", sortOrder: "descending"}).Resources, fixture.Resources,
                    `Instance member 'Resources' did not equal 'Resources' value included in inbound fixture #${suite.indexOf(fixture) + 1}`);
            }
        });
        
        it("should not include more resources than 'itemsPerPage' value included in inbound messages", async () => {
            const {outbound: {source}} = await fixtures;
            const fixture = {...template, Resources: source};
            
            for (let itemsPerPage of [2, 5, 10, 200, 1]) {
                assert.ok(new ListResponse({...fixture, itemsPerPage}).Resources.length <= itemsPerPage,
                    "Instance member 'Resources' included more resources than specified in 'itemsPerPage' value of inbound message");
            }
        });
        
        it("should not include more resources than 'itemsPerPage' parameter when preparing outbound messages", async () => {
            const {outbound: {source}} = await fixtures;
            
            for (let itemsPerPage of [2, 5, 10, 200, 1]) {
                assert.ok(new ListResponse(source, {itemsPerPage}).Resources.length <= itemsPerPage,
                    "Instance member 'Resources' included more resources than specified in 'itemsPerPage' parameter when preparing outbound messages");
            }
        });
        
        it("should correctly compare Date instances at 'sortBy' path when preparing outbound messages", async () => {
            const {outbound: {source, targets: {sortBy: suite}}} = await fixtures;
            const {expected, sortBy} = suite.find(({sortBy}) => sortBy === "date");
            const actual = new ListResponse(source.map(({id, date}) => ({id, date: new Date(date)})), {sortBy});
                
            assert.deepStrictEqual(actual.Resources.map(({id}) => id), expected,
                "ListResponse did not correctly compare Date instances at 'sortBy' path when preparing outbound message");
        });
    });
    
    describe("#startIndex", () => {
        it("should be defined", () => {
            assert.ok("startIndex" in new ListResponse(),
                "Instance member 'startIndex' was not defined");
        });
        
        it("should be a positive integer", () => {
            const list = new ListResponse();
            
            assert.ok(typeof list.startIndex === "number" && !Number.isNaN(list.startIndex),
                "Instance member 'startIndex' was not a number");
            assert.ok(list.startIndex > 0 && Number.isInteger(list.startIndex),
                "Instance member 'startIndex' was not a positive integer");
        });
        
        it("should equal 'startIndex' value included in inbound message", async () => {
            const {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.strictEqual(new ListResponse(fixture, {startIndex: 20}).startIndex, fixture.startIndex,
                    `Instance member 'startIndex' did not equal 'startIndex' value included in inbound fixture #${suite.indexOf(fixture) + 1}`);
            }
        });
        
        it("should be honoured if 'totalResults' is less than 'itemsPerPage' when preparing outbound messages", async () => {
            const {outbound: {source}} = await fixtures;
            
            assert.strictEqual(new ListResponse(source, {startIndex: source.length}).Resources.length, 1,
                "ListResponse did not honour 'startIndex' when 'totalResults' was less than 'itemsPerPage'");
        });
        
        it("should be honoured if results are not already paginated when preparing outbound messages", async () => {
            const {outbound: {source, targets: {startIndex: suite}}} = await fixtures;
            
            for (let fixture of suite) {
                const {expected, length = source.length, sourceRange: [from = 1, to = length] = [], startIndex, itemsPerPage} = fixture;
                const actual = new ListResponse(Object.assign(source.slice(from-1, to), {length}), {startIndex, itemsPerPage});
                
                assert.deepStrictEqual(actual.Resources.map(({id}) => id), expected,
                    `ListResponse startIndex outbound target #${suite.indexOf(fixture)+1} did not honour 'startIndex' value '${startIndex}'`);
            }
        });
        
        it("should be constrained to a minimum value of one when parsing inbound messages", async () => {
            const {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.strictEqual(new ListResponse({...fixture, startIndex: -10}).startIndex, 1,
                    "Instance member 'startIndex' was not constrained to minimum value one when parsing inbound message");
            }
        });
        
        it("should be constrained to a minimum value of one when preparing outbound messages", () => {
            assert.strictEqual(new ListResponse([], {startIndex: -10}).startIndex, 1,
                "Instance member 'startIndex' was not constrained to minimum value one when preparing outbound message");
        });
    });
    
    describe("#itemsPerPage", () => {
        it("should be defined", () => {
            assert.ok("itemsPerPage" in new ListResponse(),
                "Instance member 'itemsPerPage' was not defined");
        });
        
        it("should be a non-negative integer", () => {
            const list = new ListResponse();
            
            assert.ok(typeof list.itemsPerPage === "number" && !Number.isNaN(list.itemsPerPage),
                "Instance member 'itemsPerPage' was not a number");
            assert.ok(list.itemsPerPage >= 0 && Number.isInteger(list.itemsPerPage),
                "Instance member 'itemsPerPage' was not a non-negative integer");
        });
        
        it("should equal 'itemsPerPage' value included in inbound messages", async () => {
            const {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.strictEqual(new ListResponse(fixture, {itemsPerPage: 200}).itemsPerPage, fixture.itemsPerPage,
                    `Instance member 'itemsPerPage' did not equal 'itemsPerPage' value included in inbound fixture #${suite.indexOf(fixture) + 1}`);
            }
        });
        
        it("should equal 'itemsPerPage' parameter specified at instantiation when preparing outbound messages", () => {
            assert.strictEqual(new ListResponse([], {itemsPerPage: 1}).itemsPerPage, 1,
                "Instance member 'itemsPerPage' did not equal 'itemsPerPage' parameter specified at instantiation when preparing outbound messages");
        });
        
        it("should equal 'count' parameter when 'itemsPerPage' parameter is not specified at instantiation", () => {
            assert.strictEqual(new ListResponse([], {count: 1}).itemsPerPage, 1,
                "Instance member 'itemsPerPage' did not equal 'count' parameter when 'itemsPerPage' parameter was not specified");
        });
        
        it("should prefer 'itemsPerPage' parameter over 'count' parameter specified at instantiation", () => {
            assert.strictEqual(new ListResponse([], {count: 10, itemsPerPage: 1}).itemsPerPage, 1,
                "Instance member 'itemsPerPage' did not prefer 'itemsPerPage' parameter over 'count' parameter specified at instantiation");
        });
        
        it("should fall back to the default value when 'itemsPerPage' and 'count' parameters are not specified at instantiation", () => {
            assert.strictEqual(new ListResponse([]).itemsPerPage, 20,
                "Instance member 'itemsPerPage' did not fall back to default value when 'itemsPerPage' and 'count' parameters were not specified");
        });
        
        it("should be constrained to a minimum value of zero when parsing inbound messages", async () => {
            const {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.strictEqual(new ListResponse({...fixture, itemsPerPage: -10}).itemsPerPage, 0,
                    "Instance member 'itemsPerPage' was not constrained to minimum value zero when parsing inbound message");
            }
        });
        
        it("should be constrained to a minimum value of zero when preparing outbound messages", () => {
            assert.strictEqual(new ListResponse([], {itemsPerPage: -1}).itemsPerPage, 0,
                "Instance member 'itemsPerPage' was not constrained to minimum value zero when preparing outbound message");
        });
    });
    
    describe("#totalResults", () => {
        it("should be defined", () => {
            assert.ok("totalResults" in new ListResponse(),
                "Instance member 'totalResults' was not defined");
        });
        
        it("should be a non-negative integer", () => {
            const list = new ListResponse();
            
            assert.ok(typeof list.totalResults === "number" && !Number.isNaN(list.totalResults),
                "Instance member 'totalResults' was not a number");
            assert.ok(list.totalResults >= 0 && Number.isInteger(list.totalResults),
                "Instance member 'totalResults' was not a non-negative integer");
        });
        
        it("should equal 'totalResults' value included in inbound messages", async () => {
            const {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.strictEqual(new ListResponse(fixture, {totalResults: 200}).totalResults, fixture.totalResults,
                    `Instance member 'totalResults' did not equal 'totalResults' value included in inbound fixture #${suite.indexOf(fixture) + 1}`);
            }
        });
        
        it("should equal 'totalResults' parameter when preparing outbound messages", () => {
            assert.strictEqual(new ListResponse([], {totalResults: 100}).totalResults, 100,
                "Instance member 'totalResults' did not equal 'totalResults' parameter when preparing outbound messages");
        });
        
        it("should equal 'length' property of resources array when 'totalResults' parameter is not specified", () => {
            assert.strictEqual(new ListResponse(Object.assign([], {length: 100})).totalResults, 100,
                "Instance member 'totalResults' did not equal 'length' property of resources array when 'totalResults' parameter and property were not specified");
        });
        
        it("should prefer 'totalResults' parameter over 'length' property of resources array when preparing outbound messages", () => {
            assert.strictEqual(new ListResponse(Object.assign([], {length: 1000}), {totalResults: 100}).totalResults, 100,
                "Instance member 'totalResults' did not prefer 'totalResults' parameter over 'length' property of resources array when preparing outbound messages");
        });
    });
});