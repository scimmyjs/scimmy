import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import {Attribute} from "#@/lib/types/attribute.js";
import {SchemaDefinition} from "#@/lib/types/definition.js";
import {PatchOp} from "#@/lib/messages/patchop.js";
import {createSchemaClass} from "../../hooks/schemas.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./patchop.json"), "utf8").then((f) => JSON.parse(f));
// Default parameter values to use in tests
const params = {id: "urn:ietf:params:scim:api:messages:2.0:PatchOp"};
const template = {schemas: [params.id]};
// A Schema class to use in tests
const TestSchema = createSchemaClass({
    attributes: [
        new Attribute("string", "userName", {required: true}), new Attribute("string", "displayName"),
        new Attribute("string", "nickName"), new Attribute("string", "password", {direction: "in", returned: false}),
        new Attribute("complex", "name", {}, [new Attribute("string", "formatted"), new Attribute("string", "honorificPrefix")]),
        new Attribute("complex", "emails", {multiValued: true}, [new Attribute("string", "value"), new Attribute("string", "type")]),
        new Attribute("string", "throws"), new Attribute("dateTime", "date"),
        new Attribute("complex", "members", {multiValued: true, uniqueness: false}, [
            new Attribute("string", "value", {mutable: "immutable"}),
            new Attribute("string", "display", {mutable: "immutable"}),
            new Attribute("reference", "$ref", {mutable: "immutable", referenceTypes: ["User", "Group"]}),
            new Attribute("string", "type", {mutable: "immutable", canonicalValues: ["User", "Group"]})
        ])
    ]
});

describe("SCIMMY.Messages.PatchOp", () => {
    describe("@constructor", () => {
        it("should not instantiate requests with invalid schemas", () => {
            assert.throws(() => new PatchOp({schemas: ["nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `PatchOp request body messages must exclusively specify schema as '${params.id}'`},
                "PatchOp instantiated with invalid 'schemas' property");
            assert.throws(() => new PatchOp({schemas: [params.id, "nonsense"]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `PatchOp request body messages must exclusively specify schema as '${params.id}'`},
                "PatchOp instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'Operations' attribute of 'request' parameter to be an array", () => {
            assert.throws(() => new PatchOp({...template, Operations: "a string"}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "PatchOp expects 'Operations' attribute of 'request' parameter to be an array"},
                "PatchOp instantiated with invalid 'Operations' attribute value 'a string' of 'request' parameter");
        });
        
        it("should expect at least one patch op in 'Operations' attribute of 'request' parameter", () => {
            assert.throws(() => new PatchOp({...template}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "PatchOp request body must contain 'Operations' attribute with at least one operation"},
                "PatchOp instantiated without at least one patch op in 'Operations' attribute of 'request' parameter");
            assert.throws(() => new PatchOp({...template, Operations: []}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "PatchOp request body must contain 'Operations' attribute with at least one operation"},
                "PatchOp instantiated without at least one patch op in 'Operations' attribute of 'request' parameter");
        });
        
        it("should expect all patch ops to be 'complex' values in 'Operations' attribute of 'request' parameter", () => {
            assert.throws(() => new PatchOp({...template, Operations: [{op: "add", value: {}}, "a string"]}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "PatchOp request body expected value type 'complex' for operation 2 but found type 'string'"},
                `PatchOp instantiated with invalid patch op 'a string' in 'Operations' attribute of 'request' parameter`);
            assert.throws(() => new PatchOp({...template, Operations: [{op: "add", value: {}}, true]}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "PatchOp request body expected value type 'complex' for operation 2 but found type 'boolean'"},
                `PatchOp instantiated with invalid patch op 'true' in 'Operations' attribute of 'request' parameter`);
            assert.throws(() => new PatchOp({...template, Operations: [{op: "add", value: {}}, []]}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "PatchOp request body expected value type 'complex' for operation 2 but found type 'collection'"},
                `PatchOp instantiated with invalid patch op '[]' in 'Operations' attribute of 'request' parameter`);
        });
        
        it("should expect all patch ops to have an 'op' value in 'Operations' attribute of 'request' parameter", () => {
            assert.throws(() => new PatchOp({...template, Operations: [{}]}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "Missing required attribute 'op' from operation 1 in PatchOp request body"},
                "PatchOp instantiated with invalid patch op '{}' in 'Operations' attribute of 'request' parameter");
            assert.throws(() => new PatchOp({...template, Operations: [{op: "add", value: {}}, {value: "a string"}]}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "Missing required attribute 'op' from operation 2 in PatchOp request body"},
                `PatchOp instantiated with invalid patch op '{value: "a string"}' in 'Operations' attribute of 'request' parameter`);
        });
        
        it("should not accept unknown 'op' values in 'Operations' attribute of 'request' parameter", () => {
            assert.throws(() => new PatchOp({...template, Operations: [{op: "a string"}]}),
                "PatchOp instantiated with invalid 'op' value 'a string' in 'Operations' attribute of 'request' parameter");
            assert.throws(() => new PatchOp({...template, Operations: [{op: "a string"}]}),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: "Invalid operation 'a string' for operation 1 in PatchOp request body"},
                "PatchOp did not throw correct SCIMError when instantiated with invalid 'op' value 'a string' in 'Operations' attribute of 'request' parameter");
        });
        
        it("should ignore case of 'op' values in 'Operations' attribute of 'request' parameter", () => {
            const ops = [
                "Add", "ADD", "aDd",
                "Remove", "REMOVE", "rEmOvE",
                "Replace", "REPLACE", "rEpLaCe"
            ];

            for (let op of ops) {
                try {
                    new PatchOp({...template, Operations: [{op, path: "test", value: {}}]});
                } catch ({message, ...ex}) {
                    assert.notDeepStrictEqual({...ex, message},
                        {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                            message: `Invalid operation '${op}' for operation 1 in PatchOp request body`},
                        `PatchOp did not ignore case of 'op' value '${op}' in 'Operations' attribute of 'request' parameter`);
                }
            }
        });
        
        it("should expect all 'add' ops to have a 'value' value in 'Operations' attribute of 'request' parameter", () => {
            assert.throws(() => new PatchOp({...template, Operations: [{op: "add", value: {}}, {op: "add", value: false}, {op: "add", path: "test"}]}),
                {name: "SCIMError", status: 400, scimType: "invalidValue",
                    message: "Missing required attribute 'value' for 'add' op of operation 3 in PatchOp request body"},
                "PatchOp instantiated with missing 'value' value for 'add' op in 'Operations' attribute of 'request' parameter");
        });
        
        it("should expect all 'remove' ops to have a 'path' value in 'Operations' attribute of 'request' parameter", () => {
            assert.throws(() => new PatchOp({...template, Operations: [{op: "remove", path: "test"}, {op: "remove"}]}),
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
                assert.throws(() => new PatchOp({...template, Operations: [op]}),
                    {name: "SCIMError", status: 400, scimType: "invalidPath",
                        message: `Invalid path '${op.path}' for operation 1 in PatchOp request body`},
                    `PatchOp instantiated with invalid 'path' value '${op.path}' in 'Operations' attribute of 'request' parameter`);
            }
        });
    });
    
    describe(".id", () => {
        it("should be defined", () => {
            assert.ok("id" in PatchOp,
                "Static member 'id' not defined");
        });
        
        it("should be a string", () => {
            assert.ok(typeof PatchOp.id === "string",
                "Static member 'id' was not a string");
        });
        
        it("should match SCIM Patch Operation Message schema ID", async () => {
            assert.strictEqual(PatchOp.id, params.id,
                "Static member 'id' did not match SCIM Patch Operation Message schema ID");
        });
    });
    
    describe("#apply()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new PatchOp({...template, Operations: [{op: "add", value: {}}]})).apply === "function",
                "Instance method 'apply' was not implemented");
        });
        
        it("should expect message to be dispatched before 'apply' is called", async () => {
            await assert.rejects(() => new PatchOp().apply(),
                {name: "TypeError", message: "PatchOp expected message to be dispatched before calling 'apply' method"},
                "Instance method 'apply' did not expect message to be dispatched before proceeding");
        });
        
        it("should expect 'resource' parameter to be defined", async () => {
            await assert.rejects(() => new PatchOp({...template, Operations: [{op: "add", value: false}]}).apply(),
                {name: "TypeError", message: "Expected 'resource' to be an instance of SCIMMY.Types.Schema in PatchOp 'apply' method"},
                "Instance method 'apply' did not expect 'resource' parameter to be defined");
        });
        
        it("should expect 'resource' parameter to be an instance of SCIMMY.Types.Schema", async () => {
            for (let value of [{}, new Date()]) {
                await assert.rejects(() => new PatchOp({...template, Operations: [{op: "add", value: false}]}).apply(value),
                    {name: "TypeError", message: "Expected 'resource' to be an instance of SCIMMY.Types.Schema in PatchOp 'apply' method"},
                    "Instance method 'apply' did not verify 'resource' parameter type before proceeding");
            }
        });
        
        it("should reject unknown 'op' values in operations", async () => {
            const Operations = [{op: "test"}];
            const message = Object.assign(new PatchOp({...template, Operations: [{op: "add", value: {}}]}), {Operations});
            
            await assert.rejects(() => message.apply(new TestSchema({id: "1234", userName: "asdf"})),
                {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                    message: `Invalid operation 'test' for operation 1 in PatchOp request body`},
                "Instance method 'apply' did not throw correct SCIMError at invalid operation with 'op' value 'test'");
        });
        
        it("should return nothing when applied PatchOp does not modify resource", async () => {
            const instance = new TestSchema({id: "1234", userName: "asdf", date: "2017-06-16T21:36:48.362Z", emails: [{type: "work", value: "test@example.org"}]});
            const message = new PatchOp({
                ...template, Operations: [
                    {op: "remove", path: "date"},
                    {op: "remove", path: `emails[type eq "work" and value ew "example.com"]`},
                    {op: "add", value: {date: "2017-06-16T21:36:48.362Z"}},
                    {op: "replace", path: "date", value: "2017-06-16T21:36:48.362Z"}
                ]
            });
            
            assert.deepStrictEqual(await message.apply(instance), undefined,
                "Instance method 'apply' did not return nothing when resource was not modified");
        });
        
        for (let op of ["add", "remove", "replace"]) {
            it(`should support simple and complex '${op}' operations`, async () => {
                const {inbound: {[op]: suite}} = await fixtures;
                
                for (let fixture of suite) {
                    const message = new PatchOp({...template, Operations: fixture.ops});
                    const source = new TestSchema(fixture.source);
                    const expected = new TestSchema(fixture.target, "out");
                    const actual = new TestSchema(await message.apply(source, (patched) => {
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
            
            it(`should support namespaced attributes in '${op}' operations`, async () => {
                const attributes = [new Attribute("string", "organization"), new Attribute("string", "test")];
                const extension = new SchemaDefinition("Extension", TestSchema.definition.id.replace("Test", "Extension"), "", attributes);
                const source = {id: "1234", userName: "asdf", [`${extension.id}:test`]: "value", ...(op === "add" ? {} : {[`${extension.id}:organization`]: "COMPANY1"})};
                const target = {id: "1234", userName: "asdf", [extension.id]: {test: "value", ...(op === "remove" ? {} : {organization: "COMPANY2"})}};
                const Operations = [{op, path: `${extension.id}:organization`, ...(op === "remove" ? {} : {value: "COMPANY2"})}];
                
                try {
                    TestSchema.definition.extend(extension);
                    
                    const expected = new TestSchema(target, "out");
                    const actual = await new PatchOp({...template, Operations}).apply(new TestSchema(source));
                    
                    assert.deepStrictEqual(actual, expected,
                        `PatchOp 'apply' did not support namespaced attributes in '${op}' operations`);
                } finally {
                    TestSchema.definition.truncate(extension);
                }
            });
            
            if (["add", "replace"].includes(op)) {
                it(`should expect 'value' to be an object when 'path' is not specified in '${op}' operations`, async () => {
                    const Operations = [{op, value: false}];
                    const target = new TestSchema({id: "1234", userName: "asdf"});
                    const message = new PatchOp({...template, Operations});
                    
                    await assert.rejects(() => message.apply(target),
                        {name: "SCIMError", status: 400, scimType: "invalidValue",
                            message: `Attribute 'value' must be an object when 'path' is empty for '${op}' op of operation 1 in PatchOp request body`},
                        `Instance method 'apply' did not expect 'value' to be an object when 'path' was not specified in '${op}' operations`);
                });
                
                it(`should rethrow extensibility errors as SCIMErrors when 'path' points to nonexistent attribute in '${op}' operations`, async () => {
                    const Operations = [{op, path: "test", value: ""}];
                    const message = new PatchOp({...template, Operations});
                    const attribute = new Attribute("string", "test");
                    // Wrap the target in a proxy...
                    const source = new TestSchema({id: "1234", userName: "asdf"});
                    const target = new Proxy(source, {
                        // ...so the constructor can be intercepted...
                        get: (target, prop) => (prop !== "constructor" ? target[prop] : (
                            new Proxy(TestSchema, {
                                // ...and an unhandled exception can be thrown!
                                construct: (target, [resource]) => Object.defineProperty({...resource}, "test", {
                                    set: (value) => (source.test = value)
                                })
                            })
                        ))
                    });
                    
                    try {
                        TestSchema.definition.extend(attribute);
                        
                        await assert.rejects(() => message.apply(target),
                            {name: "SCIMError", status: 400, scimType: "invalidPath",
                                message: `Invalid attribute path 'test' in supplied value for '${op}' op of operation 1 in PatchOp request body`},
                            `Instance method 'apply' did not rethrow extensibility error as SCIMError when 'path' pointed to nonexistent attribute in '${op}' operations`);
                    } finally {
                        TestSchema.definition.truncate(attribute);
                    }
                });
            }
            
            it(`should rethrow SCIMErrors with added location details in '${op}' operations`, async () => {
                const Operations = [{op, ...(op === "remove" ? {path: "id"} : {value: {id: "test"}})}];
                const target = new TestSchema({id: "1234", userName: "asdf"});
                const message = new PatchOp({...template, Operations});
                
                await assert.rejects(() => message.apply(target),
                    {name: "SCIMError", status: 400, scimType: "mutability",
                        message: `Attribute 'id' already defined and is not mutable for '${op}' op of operation 1 in PatchOp request body`},
                    `Instance method 'apply' did not rethrow SCIMError with added location details in '${op}' operations`);
            });
    
            it(`should rethrow other exceptions as SCIMErrors with location details in '${op}' operations`, async () => {
                const details = (op === "remove" ? {path: "throws"} : {value: {throws: "test"}});
                const Operations = [{op, ...details}];
                const message = new PatchOp({...template, Operations});
                // Wrap the target in a proxy...
                const target = new Proxy(new TestSchema({id: "1234", userName: "asdf"}), {
                    // ...so the constructor can be intercepted...
                    get: (target, prop) => (prop !== "constructor" ? target[prop] : (
                        new Proxy(TestSchema, {
                            // ...and an unhandled exception can be thrown! 
                            construct: (target, [resource]) => Object.defineProperty({...resource}, "throws", {
                                set: (value) => {throw new Error(`Failing as requested with value '${value}'`)}
                            })
                        })
                    ))
                });
                
                await assert.rejects(() => message.apply(target),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: `Failing as requested with value '${details.value?.throws}' for '${op}' op of operation 1 in PatchOp request body`},
                    `Instance method 'apply' did not rethrow other exception as SCIMError with location details in '${op}' operations`);
            });
            
            it(`should respect attribute mutability in '${op}' operations`, async () => {
                const Operations = [{op, path: "id", ...(op === "add" ? {value: "asdf"} : {})}];
                const target = new TestSchema({id: "1234", userName: "asdf"});
                const message = new PatchOp({...template, Operations});
                
                await assert.rejects(() => message.apply(target),
                    {name: "SCIMError", status: 400, scimType: "mutability",
                        message: `Attribute 'id' already defined and is not mutable for '${op}' op of operation 1 in PatchOp request body`},
                    `Instance method 'apply' did not respect attribute mutability in '${op}' operations`);
            });
            
            it(`should not remove required attributes in '${op}' operations`, async () => {
                const Operations = [{op, path: "userName", ...(op === "add" ? {value: null} : {})}];
                const target = new TestSchema({id: "1234", userName: "asdf"});
                const message = new PatchOp({...template, Operations});
                
                await assert.rejects(() => message.apply(target),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: `Required attribute 'userName' is missing for '${op}' op of operation 1 in PatchOp request body`},
                    `Instance method 'apply' removed required attributes in '${op}' operations`);
            });
            
            it(`should expect all targeted attributes to exist in '${op}' operations`, async () => {
                const Operations = [{op, path: "test", ...(op === "add" ? {value: null} : {})}];
                const target = new TestSchema({id: "1234", userName: "asdf"});
                const message = new PatchOp({...template, Operations});
                
                await assert.rejects(() => message.apply(target),
                    {name: "SCIMError", status: 400, scimType: "invalidPath",
                        message: `Invalid path 'test' for '${op}' op of operation 1 in PatchOp request body`},
                    `Instance method 'apply' did not expect target attribute 'test' to exist in '${op}' operations`);
            });
        }
    });
});