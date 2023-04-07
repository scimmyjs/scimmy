import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import SCIMMY from "#@/scimmy.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./filter.json"), "utf8").then((f) => JSON.parse(f));

export const FilterSuite = () => {
    it("should include static class 'Filter'", () => 
        assert.ok(!!SCIMMY.Types.Filter, "Static class 'Filter' not defined"));
    
    describe("SCIMMY.Types.Filter", () => {
        it("should not require arguments at instantiation", () => {
            assert.doesNotThrow(() => new SCIMMY.Types.Filter(),
                "Filter type class did not instantiate without arguments");
        });
        
        it("should extend native 'Array' class", () => {
            assert.ok(new SCIMMY.Types.Filter() instanceof Array,
                "Filter type class did not extend native 'Array' class");
        });
        
        describe("#constructor", () => {
            it("should expect 'expression' argument to be a non-empty string or collection of objects", () => {
                const fixtures = [
                    ["number value '1'", 1],
                    ["boolean value 'false'", false]
                ];
                
                assert.throws(() => new SCIMMY.Types.Filter(""),
                    {name: "TypeError", message: "Expected 'expression' parameter string value to not be empty in Filter constructor"},
                    "Filter type class did not expect expression to be a non-empty string");
                
                for (let [label, value] of fixtures) {
                    assert.throws(() => new SCIMMY.Types.Filter(value),
                        {name: "TypeError", message: "Expected 'expression' parameter to be a string, object, or array in Filter constructor"},
                        `Filter type class did not reject 'expression' parameter ${label}`);
                }
            });
            
            it("should expect expression to a be well formed SCIM filter string", () => {
                assert.throws(() => new SCIMMY.Types.Filter("id -pr"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter", message: "Unexpected token '-pr' in filter"},
                    "Filter type class did not reject 'expression' parameter value 'id -pr' that was not well formed");
            });
            
            it("should expect all grouping operators to be opened and closed in filter string expression", () => {
                assert.throws(() => new SCIMMY.Types.Filter("[id pr"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter",
                        message: "Missing closing ']' token in filter '[id pr'"},
                    "Filter type class did not reject 'expression' parameter with unmatched opening '[' bracket");
                assert.throws(() => new SCIMMY.Types.Filter("id pr]"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter",
                        message: "Unexpected token ']' in filter"},
                    `Filter type class did not reject 'expression' parameter with unmatched closing ']' bracket`);
                assert.throws(() => new SCIMMY.Types.Filter("(id pr"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter",
                        message: "Missing closing ')' token in filter '(id pr'"},
                    "Filter type class did not reject 'expression' parameter with unmatched opening '(' bracket");
                assert.throws(() => new SCIMMY.Types.Filter("id pr)"),
                    {name: "SCIMError", status: 400, scimType: "invalidFilter", 
                        message: "Unexpected token ')' in filter"},
                    `Filter type class did not reject 'expression' parameter with unmatched closing ')' bracket`);
            });
            
            it("should parse simple expressions without logical or grouping operators", async () => {
                const {parse: {simple: suite}} = await fixtures;
                
                for (let fixture of suite) {
                    assert.deepStrictEqual([...new SCIMMY.Types.Filter(fixture.source)], fixture.target,
                        `Filter type class failed to parse simple expression '${fixture.source}'`);
                }
            });
            
            it("should parse expressions with logical operators", async () => {
                const {parse: {logical: suite}} = await fixtures;
                
                for (let fixture of suite) {
                    assert.deepStrictEqual([...new SCIMMY.Types.Filter(fixture.source)], fixture.target,
                        `Filter type class failed to parse expression '${fixture.source}' with logical operators`);
                }
            });
            
            it("should parse expressions with grouping operators", async () => {
                const {parse: {grouping: suite}} = await fixtures;
                
                for (let fixture of suite) {
                    assert.deepStrictEqual([...new SCIMMY.Types.Filter(fixture.source)], fixture.target,
                        `Filter type class failed to parse expression '${fixture.source}' with grouping operators`);
                }
            });
            
            it("should parse complex expressions with a mix of logical and grouping operators", async () => {
                const {parse: {complex: suite}} = await fixtures;
                
                for (let fixture of suite) {
                    assert.deepStrictEqual([...new SCIMMY.Types.Filter(fixture.source)], fixture.target,
                        `Filter type class failed to parse complex expression '${fixture.source}'`);
                }
            });
        });
        
        describe(".match()", () => {
            it("should have instance method 'match'", () => {
                assert.ok(typeof (new SCIMMY.Types.Filter()).match === "function",
                    "Instance method 'match' not defined");
            });
            
            const targets = [
                ["comparators", "handle matches for known comparison expressions"],
                ["nesting", "handle matching of nested attributes"],
                ["cases", "match attribute names in a case-insensitive manner"],
                ["negations", "handle matches with negation expressions"],
                ["numbers", "correctly compare numeric attribute values"],
                ["dates", "correctly compare ISO 8601 datetime string attribute values"],
                ["logicalAnd", "match values against all expressions in a group of logical 'and' expressions for a single attribute"],
                ["logicalOr", "match values against any one expression in a group of logical 'or' expressions"]
            ];
            
            for (let [key, label] of targets) {
                it(`should ${label}`, async () => {
                    const {match: {source, targets: {[key]: suite}}} = await fixtures;
                    
                    for (let fixture of suite) {
                        assert.deepStrictEqual(new SCIMMY.Types.Filter(fixture.expression).match(source).map((v) => v.id), fixture.expected,
                            `Unexpected matches in '${key}' fixture #${suite.indexOf(fixture) + 1} with expression '${JSON.stringify(fixture.expression)}'`);
                    }
                });
            }
        });
    });
};