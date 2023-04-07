import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import SCIMMY from "#@/scimmy.js";

const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./patchop.json"), "utf8").then((f) => JSON.parse(f));
const params = {id: "urn:ietf:params:scim:api:messages:2.0:PatchOp"};
const template = {schemas: [params.id]};

export const PatchOpSuite = () => {
    it("should include static class 'PatchOp'", () => 
        assert.ok(!!SCIMMY.Messages.PatchOp, "Static class 'PatchOp' not defined"));
    
    describe("SCIMMY.Messages.PatchOp", () => {
        describe("#constructor", () => {
            it("should not instantiate requests with invalid schemas", () => {
                assert.throws(() => new SCIMMY.Messages.PatchOp({schemas: ["nonsense"]}),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: `PatchOp request body messages must exclusively specify schema as '${params.id}'`},
                    "PatchOp instantiated with invalid 'schemas' property");
                assert.throws(() => new SCIMMY.Messages.PatchOp({schemas: [params.id, "nonsense"]}),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: `PatchOp request body messages must exclusively specify schema as '${params.id}'`},
                    "PatchOp instantiated with invalid 'schemas' property");
            });
            
            it("should expect 'Operations' attribute of 'request' parameter to be an array", () => {
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: "a string"}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "PatchOp expects 'Operations' attribute of 'request' parameter to be an array"},
                    "PatchOp instantiated with invalid 'Operations' attribute value 'a string' of 'request' parameter");
            });
            
            it("should expect at least one patch op in 'Operations' attribute of 'request' parameter", () => {
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "PatchOp request body must contain 'Operations' attribute with at least one operation"},
                    "PatchOp instantiated without at least one patch op in 'Operations' attribute of 'request' parameter");
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: []}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "PatchOp request body must contain 'Operations' attribute with at least one operation"},
                    "PatchOp instantiated without at least one patch op in 'Operations' attribute of 'request' parameter");
            });
            
            it("should expect all patch ops to be 'complex' values in 'Operations' attribute of 'request' parameter", () => {
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "add", value: {}}, "a string"]}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "PatchOp request body expected value type 'complex' for operation 2 but found type 'string'"},
                    `PatchOp instantiated with invalid patch op 'a string' in 'Operations' attribute of 'request' parameter`);
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "add", value: {}}, true]}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "PatchOp request body expected value type 'complex' for operation 2 but found type 'boolean'"},
                    `PatchOp instantiated with invalid patch op 'true' in 'Operations' attribute of 'request' parameter`);
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "add", value: {}}, []]}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "PatchOp request body expected value type 'complex' for operation 2 but found type 'collection'"},
                    `PatchOp instantiated with invalid patch op '[]' in 'Operations' attribute of 'request' parameter`);
            });
            
            it("should expect all patch ops to have an 'op' value in 'Operations' attribute of 'request' parameter", () => {
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{}]}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Missing required attribute 'op' from operation 1 in PatchOp request body"},
                    "PatchOp instantiated with invalid patch op '{}' in 'Operations' attribute of 'request' parameter");
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "add", value: {}}, {value: "a string"}]}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Missing required attribute 'op' from operation 2 in PatchOp request body"},
                    `PatchOp instantiated with invalid patch op '{value: "a string"}' in 'Operations' attribute of 'request' parameter`);
            });
            
            it("should not accept unknown 'op' values in 'Operations' attribute of 'request' parameter", () => {
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "a string"}]}),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "Invalid operation 'a string' for operation 1 in PatchOp request body"},
                    "PatchOp instantiated with invalid 'op' value 'a string' in 'Operations' attribute of 'request' parameter");
            });
            
            it("should ignore case of 'op' values in 'Operations' attribute of 'request' parameter", () => {
                try {
                    new SCIMMY.Messages.PatchOp({...template, Operations: [
                        {op: "Add", value: {}}, {op: "ADD", value: {}}, {op: "aDd", value: {}},
                        {op: "Remove", path: "test"}, {op: "REMOVE", path: "test"}, {op: "rEmOvE", path: "test"},
                        {op: "Replace", value: {}}, {op: "REPLACE", value: {}}, {op: "rEpLaCe", value: {}},
                    ]});
                } catch (ex) {
                    if (ex instanceof SCIMMY.Types.Error && ex.message.startsWith("Invalid operation")) {
                        const op = ex.message.replace("Invalid operation '").split("'").unshift();
                        assert.fail(`PatchOp did not ignore case of 'op' value '${op}' in 'Operations' attribute of 'request' parameter`);
                    }
                }
            });
            
            it("should expect all 'add' ops to have a 'value' value in 'Operations' attribute of 'request' parameter", () => {
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "add", value: {}}, {op: "add", value: false}, {op: "add", path: "test"}]}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Missing required attribute 'value' for 'add' op of operation 3 in PatchOp request body"},
                    "PatchOp instantiated with missing 'value' value for 'add' op in 'Operations' attribute of 'request' parameter");
            });
            
            it("should expect all 'remove' ops to have a 'path' value in 'Operations' attribute of 'request' parameter", () => {
                assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "remove", path: "test"}, {op: "remove"}]}),
                    {name: "SCIMError", status: 400, scimType: "noTarget",
                        message: "Missing required attribute 'path' for 'remove' op of operation 2 in PatchOp request body"},
                    "PatchOp instantiated with missing 'path' value for 'remove' op in 'Operations' attribute of 'request' parameter");
            });
            
            it("should expect all patch op 'path' values to be strings in 'Operations' attribute of 'request' parameter", () => {
                const operations = [
                    {op: "remove", path: 1},
                    {op: "remove", path: true},
                    {op: "add", value: 1, path: false}
                ];
                
                for (let op of operations) {
                    assert.throws(() => new SCIMMY.Messages.PatchOp({...template, Operations: [op]}),
                        {name: "SCIMError", status: 400, scimType: "invalidPath",
                            message: `Invalid path '${op.path}' for operation 1 in PatchOp request body`},
                        `PatchOp instantiated with invalid 'path' value '${op.path}' in 'Operations' attribute of 'request' parameter`);
                }
            });
        });
        
        describe("#apply()", () => {
            it("should have instance method 'apply'", () => {
                assert.ok(typeof (new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "add", value: {}}]})).apply === "function",
                    "Instance method 'apply' not defined");
            });
            
            it("should expect message to be dispatched before 'apply' is called", async () => {
                await assert.rejects(() => new SCIMMY.Messages.PatchOp().apply(),
                    {name: "TypeError", message: "PatchOp expected message to be dispatched before calling 'apply' method"},
                    "PatchOp did not expect message to be dispatched before proceeding with 'apply' method");
            });
            
            it("should expect 'resource' parameter to be defined", async () => {
                await assert.rejects(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "add", value: false}]}).apply(),
                    {name: "TypeError", message: "Expected 'resource' to be an instance of SCIMMY.Types.Schema in PatchOp 'apply' method"},
                    "PatchOp did not expect 'resource' parameter to be defined in 'apply' method");
            });
            
            it("should expect 'resource' parameter to be an instance of SCIMMY.Types.Schema", async () => {
                for (let value of [{}, new Date()]) {
                    await assert.rejects(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op: "add", value: false}]}).apply(value),
                        {name: "TypeError", message: "Expected 'resource' to be an instance of SCIMMY.Types.Schema in PatchOp 'apply' method"},
                        "PatchOp did not verify 'resource' parameter type before proceeding with 'apply' method");
                }
            });
            
            for (let op of ["add", "remove", "replace"]) {
                it(`should support simple and complex '${op}' operations`, async () => {
                    const {inbound: {[op]: suite}} = await fixtures;
                    
                    for (let fixture of suite) {
                        const message = new SCIMMY.Messages.PatchOp({...template, Operations: fixture.ops});
                        const source = new SCIMMY.Schemas.User(fixture.source);
                        const expected = new SCIMMY.Schemas.User(fixture.target, "out");
                        const actual = new SCIMMY.Schemas.User(await message.apply(source, (patched) => {
                            const expected = JSON.parse(JSON.stringify({...fixture.target, meta: undefined}));
                            const actual = JSON.parse(JSON.stringify({...patched, schemas: undefined, meta: undefined}));
                            
                            // Also make sure the resource is handled correctly during finalisation
                            assert.deepStrictEqual(actual, expected,
                                `PatchOp 'apply' patched resource unexpectedly in '${op}' op specified in inbound fixture ${suite.indexOf(fixture) + 1}`);
                            
                            return patched;
                        }), "out");
                        
                        assert.deepStrictEqual(actual, expected,
                            `PatchOp 'apply' did not support '${op}' op specified in inbound fixture ${suite.indexOf(fixture) + 1}`);
                    }
                });
                
                if (["add", "replace"].includes(op)) {
                    it(`should expect 'value' to be an object when 'path' is not specified in '${op}' operations`, async () => {
                        await assert.rejects(() => new SCIMMY.Messages.PatchOp({...template, Operations: [{op, value: false}]})
                                .apply(new SCIMMY.Schemas.User({id: "1234", userName: "asdf"})),
                            {name: "SCIMError", status: 400, scimType: "invalidValue",
                                message: `Attribute 'value' must be an object when 'path' is empty for '${op}' op of operation 1 in PatchOp request body`},
                            `PatchOp did not expect 'value' to be an object when 'path' was not specified in '${op}' operations`);
                    });
                }
                
                it(`should respect attribute mutability in '${op}' operations`, async () => {
                    const Operations = [{op, path: "id", ...(op === "add" ? {value: "asdf"} : {})}];
                    
                    await assert.rejects(() => new SCIMMY.Messages.PatchOp({...template, Operations})
                            .apply(new SCIMMY.Schemas.User({id: "1234", userName: "asdf"})),
                        {name: "SCIMError", status: 400, scimType: "invalidValue",
                            message: `Attribute 'id' already defined and is not mutable for '${op}' op of operation 1 in PatchOp request body`},
                        `PatchOp did not respect attribute mutability in '${op}' operations`);
                });
                
                it(`should not remove required attributes in '${op}' operations`, async () => {
                    const Operations = [{op, path: "userName", ...(op === "add" ? {value: null} : {})}];
                    
                    await assert.rejects(() => new SCIMMY.Messages.PatchOp({...template, Operations})
                            .apply(new SCIMMY.Schemas.User({id: "1234", userName: "asdf"})),
                        {name: "SCIMError", status: 400, scimType: "invalidValue",
                            message: `Required attribute 'userName' is missing for '${op}' op of operation 1 in PatchOp request body`},
                        `PatchOp removed required attributes in '${op}' operations`);
                });
            }
        });
    });
};