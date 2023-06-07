import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import {Filter} from "#@/lib/types/filter.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./filter.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Types.Filter", () => {
    it("should extend native 'Array' class", () => {
        assert.ok(new Filter() instanceof Array,
            "Filter type class did not extend native 'Array' class");
    });
    
    describe("@constructor", () => {
        it("should not require arguments", () => {
            assert.doesNotThrow(() => new Filter(),
                "Filter type class did not instantiate without arguments");
        });
        
        context("when 'expression' argument is defined", () => {
            const fixtures = [
                ["a primitive number", "number value '1'", 1],
                ["a primitive boolean", "boolean value 'false'", false]
            ];
            
            for (let [label, descriptor, value] of fixtures) {
                it(`should not be ${label}`, () => {
                    assert.throws(() => new Filter(value),
                        {name: "TypeError", message: "Expected 'expression' parameter to be a string, object, or array in Filter constructor"},
                        `Filter type class did not reject 'expression' parameter ${descriptor}`);
                });
            }
        });
        
        context("when 'expression' argument is a string", () => {
            it("should not be empty", () => {
                assert.throws(() => new Filter(""),
                    {name: "TypeError", message: "Expected 'expression' parameter string value to not be empty in Filter constructor"},
                    "Filter type class did not expect expression to be a non-empty string");
            });
            
            it("should be a well formed SCIM filter string expression", () => {
                assert.throws(() => new Filter("id -pr"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter", message: "Unexpected token '-pr' in filter"},
                    "Filter type class did not reject 'expression' parameter value 'id -pr' that was not well formed");
            });
            
            it("should expect all grouping operators to be opened and closed", () => {
                assert.throws(() => new Filter("[id pr"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter",
                        message: "Missing closing ']' token in filter '[id pr'"},
                    "Filter type class did not reject 'expression' parameter with unmatched opening '[' bracket");
                assert.throws(() => new Filter("id pr]"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter",
                        message: "Unexpected token ']' in filter"},
                    `Filter type class did not reject 'expression' parameter with unmatched closing ']' bracket`);
                assert.throws(() => new Filter("(id pr"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter",
                        message: "Missing closing ')' token in filter '(id pr'"},
                    "Filter type class did not reject 'expression' parameter with unmatched opening '(' bracket");
                assert.throws(() => new Filter("id pr)"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter", 
                        message: "Unexpected token ')' in filter"},
                    `Filter type class did not reject 'expression' parameter with unmatched closing ')' bracket`);
            });
            
            it("should parse simple expressions without logical or grouping operators", async function () {
                const {parse: {simple: suite}} = await fixtures;
                
                if (!suite.length) this.skip();
                else for (let fixture of suite) {
                    assert.deepStrictEqual([...new Filter(fixture.source)], fixture.target,
                        `Filter type class failed to parse simple expression '${fixture.source}'`);
                }
            });
            
            it("should parse expressions with logical operators", async function () {
                const {parse: {logical: suite}} = await fixtures;
                
                if (!suite.length) this.skip();
                else for (let fixture of suite) {
                    assert.deepStrictEqual([...new Filter(fixture.source)], fixture.target,
                        `Filter type class failed to parse expression '${fixture.source}' with logical operators`);
                }
            });
            
            it("should parse expressions with grouping operators", async function () {
                const {parse: {grouping: suite}} = await fixtures;
                
                if (!suite.length) this.skip();
                else for (let fixture of suite) {
                    assert.deepStrictEqual([...new Filter(fixture.source)], fixture.target,
                        `Filter type class failed to parse expression '${fixture.source}' with grouping operators`);
                }
            });
            
            it("should parse complex expressions with a mix of logical and grouping operators", async function () {
                const {parse: {complex: suite}} = await fixtures;
                
                if (!suite.length) this.skip();
                else for (let fixture of suite) {
                    assert.deepStrictEqual([...new Filter(fixture.source)], fixture.target,
                        `Filter type class failed to parse complex expression '${fixture.source}'`);
                }
            });
        });
    });
    
    describe("#expression", () => {
        context("when 'expression' argument was a string at instantiation", () => {
            it("should be defined", () => {
                assert.ok("expression" in new Filter("id pr"),
                    "Instance member 'expression' was not defined");
            });
            
            it("should be a string", () => {
                assert.ok(typeof (new Filter("id pr")).expression === "string",
                    "Instance member 'expression' was not a string");
            });
            
            it("should always equal supplied 'expression' string argument", async function () {
                const {parse: {simple, logical, grouping, complex}} = await fixtures;
                const suite = [...simple, ...logical, ...grouping, ...complex].map(f => f?.source).filter(f => f);
                
                if (!suite.length) this.skip();
                else for (let fixture of suite) {
                    assert.strictEqual((new Filter(fixture)).expression, fixture,
                        `Instance member 'expression' did not equal supplied expression string '${fixture}'`);
                }
            });
        });
        
        context("when 'expression' argument was an object, or array of objects at instantiation", () => {
            it("should be defined", () => {
                assert.ok("expression" in new Filter({id: ["pr"]}),
                    "Instance member 'expression' was not defined");
            });
            
            it("should be a string", () => {
                assert.ok(typeof (new Filter({id: ["pr"]})).expression === "string",
                    "Instance member 'expression' was not a string");
            });
            
            it("should stringify simple expression objects without logical or grouping operators", async function () {
                const {expression: {simple: suite}} = await fixtures;
                
                if (!suite.length) this.skip();
                else for (let fixture of suite) {
                    assert.deepStrictEqual((new Filter(fixture.source)).expression, fixture.target,
                        `Filter type class failed to stringify simple expression object '${JSON.stringify(fixture.source)}'`);
                }
            });
            
            it("should stringify expression objects with logical operators", async function () {
                const {expression: {logical: suite}} = await fixtures;
                
                if (!suite.length) this.skip();
                else for (let fixture of suite) {
                    assert.deepStrictEqual((new Filter(fixture.source)).expression, fixture.target,
                        `Filter type class failed to stringify expression object '${JSON.stringify(fixture.source)}' with logical operators`);
                }
            });
            
            it("should stringify complex expression objects with multiple branches and joins", async function () {
                const {expression: {complex: suite}} = await fixtures;
                
                if (!suite.length) this.skip();
                else for (let fixture of suite) {
                    assert.deepStrictEqual((new Filter(fixture.source)).expression, fixture.target,
                        `Filter type class failed to stringify complex expression object '${JSON.stringify(fixture.source)}'`);
                }
            });
        });
    });
    
    describe("#match()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new Filter()).match === "function",
                "Instance method 'match' not implemented");
        });
        
        const targets = [
            ["comparators", "handle matches for known comparison expressions"],
            ["nesting", "handle matching of nested attributes"],
            ["cases", "match attribute names in a case-insensitive manner"],
            ["negations", "handle matches with negation expressions"],
            ["numbers", "correctly compare numeric attribute values"],
            ["dates", "correctly compare ISO 8601 datetime string attribute values"],
            ["logicalAnd", "match values against all expressions in a group of logical 'and' expressions for a single attribute"],
            ["logicalOr", "match values against any one expression in a group of logical 'or' expressions"],
            ["unknown", "not match unknown comparators"]
        ];
        
        for (let [key, label] of targets) {
            it(`should ${label}`, async function () {
                const {match: {source, targets: {[key]: suite}}} = await fixtures;
                
                if (!suite.length) this.skip();
                else for (let fixture of suite) {
                    assert.deepStrictEqual(new Filter(fixture.expression).match(source).map((v) => v.id), fixture.expected,
                        `Unexpected matches in '${key}' fixture #${suite.indexOf(fixture) + 1} with expression '${JSON.stringify(fixture.expression)}'`);
                }
            });
        }
    });
});