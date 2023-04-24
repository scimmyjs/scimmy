import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import {Attribute} from "#@/lib/types/attribute.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./attribute.json"), "utf8").then((f) => JSON.parse(f));

/**
 * Instantiate a new Attribute from the given fixture definition
 * @param {Object} fixture - the attribute definition from the fixture
 * @returns {SCIMMY.Types.Attribute} a new Attribute instance created from the fixture definition
 */
export const instantiateFromFixture = ({type, name, mutability: m, uniqueness: u, subAttributes = [], ...config}) => (
    new Attribute(
        type, name, {...(m !== undefined ? {mutable: m} : {}), ...(u !== null ? {uniqueness: !u ? false : u} : {}), ...config}, 
        subAttributes.map(instantiateFromFixture)
    )
);

/**
 * Run valid and invalid coercion fixtures for different attribute types
 * @param {String} type - the type of attribute being tested
 * @param {Object} fixture - details of the tests to run
 * @param {Object.<string, any>} [fixture.config={}] - additional configuration for the attribute instance
 * @param {Boolean} [fixture.multiValued=false] - whether the attribute under test is multi-valued
 * @param {[string, any][]} [fixture.valid=[]] - list of valid coercion inputs to verify
 * @param {[string, string, any][]} [fixture.invalid=[]] - list of invalid coercion inputs to verify
 * @param {Function} [fixture.assertion] - function to call, with invalid input data type, to get expected assertion message
 */
function typedCoercion(type, {config = {}, multiValued = false, valid= [], invalid = [], assertion} = {}) {
    const attribute = new Attribute(type, "test", {...config, multiValued});
    const target = (multiValued ? attribute.coerce([]) : null);
    
    for (let [label, value] of valid) {
        assert.doesNotThrow(() => (multiValued ? target.push(value) : attribute.coerce(value)),
            `Instance method 'coerce' rejected ${label} when attribute type was ${type}`);
    }
    
    for (let [label, actual, value] of invalid) {
        assert.throws(() => (multiValued ? target.push(value) : attribute.coerce(value)),
            {name: "TypeError", message: (typeof assertion === "function" ? assertion(actual) : `Attribute 'test' expected value type '${type}' but found type '${actual}'`)},
            `Instance method 'coerce' did not reject ${label} when attribute type was ${type}`);
    }
}

describe("SCIMMY.Types.Attribute", () => {
    describe("@constructor", () => {
        it("should require valid 'type' argument", () => {
            assert.throws(() => new Attribute(),
                {name: "TypeError", message: "Required parameter 'type' missing from Attribute instantiation"},
                "Attribute instantiated without 'type' argument");
            assert.throws(() => new Attribute("other", "other"),
                {name: "TypeError", message: "Type 'other' not recognised in attribute definition 'other'"},
                "Attribute instantiated with unknown 'type' argument");
        });
        
        it("should require valid 'name' argument", () => {
            assert.throws(() => new Attribute("string"),
                {name: "TypeError", message: "Required parameter 'name' missing from Attribute instantiation"},
                "Attribute instantiated without 'name' argument");
    
            const invalidNames = [
                [".", "invalid.name"],
                ["@", "invalid@name"],
                ["=", "invalid=name"], 
                ["%", "invalid%name"]
            ];
            
            for (let [char, name] of invalidNames) {
                assert.throws(() => new Attribute("string", name),
                    {name: "TypeError", message: `Invalid character '${char}' in name of attribute definition '${name}'`},
                    "Attribute instantiated with invalid 'name' argument");
            }
            
            assert.ok(new Attribute("string", "validName"),
                "Attribute did not instantiate with valid 'name' argument");
        });
        
        it("should not accept 'subAttributes' argument if type is not 'complex'", () => {
            assert.throws(() => new Attribute("string", "test", {}, [new Attribute("string", "other")]),
                {name: "TypeError", message: "Attribute type must be 'complex' when subAttributes are specified in attribute definition 'test'"},
                "Attribute instantiated with subAttributes when type was not 'complex'");
        });
        
        for (let attrib of ["canonicalValues", "referenceTypes"]) {
            it(`should not accept invalid '${attrib}' configuration values`, () => {
                for (let value of ["a string", true]) {
                    assert.throws(() => new Attribute("string", "test", {[attrib]: value}),
                        {name: "TypeError", message: `Attribute '${attrib}' value must be either a collection or 'false' in attribute definition 'test'`},
                        `Attribute instantiated with invalid '${attrib}' configuration value '${value}'`);
                }
            });
        }
        
        for (let [attrib, name = attrib] of [["mutable", "mutability"], ["returned"], ["uniqueness"]]) {
            it(`should not accept invalid '${attrib}' configuration values`, () => {
                assert.throws(() => new Attribute("string", "test", {[attrib]: "a string"}),
                    {name: "TypeError", message: `Attribute '${name}' value 'a string' not recognised in attribute definition 'test'`},
                    `Attribute instantiated with invalid '${attrib}' configuration value 'a string'`);
                assert.throws(() => new Attribute("string", "test", {[attrib]: 1}),
                    {name: "TypeError", message: `Attribute '${name}' value must be either string or boolean in attribute definition 'test'`},
                    `Attribute instantiated with invalid '${attrib}' configuration number value '1'`);
                assert.throws(() => new Attribute("string", "test", {[attrib]: {}}),
                    {name: "TypeError", message: `Attribute '${name}' value must be either string or boolean in attribute definition 'test'`},
                    `Attribute instantiated with invalid '${attrib}' configuration complex value`);
                assert.throws(() => new Attribute("string", "test", {[attrib]: new Date()}),
                    {name: "TypeError", message: `Attribute '${name}' value must be either string or boolean in attribute definition 'test'`},
                    `Attribute instantiated with invalid '${attrib}' configuration date value`);
            });
        }
        
        it("should be frozen after instantiation", () => {
            const attribute = new Attribute("string", "test");
            
            assert.throws(() => attribute.test = true,
                {name: "TypeError", message: "Cannot add property test, object is not extensible"},
                "Attribute was extensible after instantiation");
            assert.throws(() => attribute.name = "something",
                {name: "TypeError", message: "Cannot assign to read only property 'name' of object '#<Attribute>'"},
                "Attribute properties were modifiable after instantiation");
            assert.throws(() => delete attribute.config,
                {name: "TypeError", message: "Cannot delete property 'config' of #<Attribute>"},
                "Attribute was not sealed after instantiation");
        });
    });
    
    describe("#toJSON()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new Attribute("string", "test")).toJSON === "function",
                "Instance method 'toJSON' was not defined");
        });
        
        it("should produce valid SCIM attribute definition objects", async () => {
            const {toJSON: suite} = await fixtures;
            
            for (let fixture of suite) {
                const attribute = instantiateFromFixture(fixture);
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(attribute)), fixture, 
                    `Attribute 'toJSON' fixture #${suite.indexOf(fixture)+1} did not produce valid SCIM attribute definition object`);
            }
        });
    });
    
    describe("#truncate()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new Attribute("string", "test")).truncate === "function",
                "Instance method 'truncate' was not defined");
        });
        
        it("should do nothing without arguments", async () => {
            const {truncate: suite} = await fixtures;
            
            for (let fixture of suite) {
                const attribute = instantiateFromFixture(fixture);
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(attribute.truncate())), fixture,
                    `Attribute 'truncate' fixture #${suite.indexOf(fixture)+1} modified attribute without arguments`);
            }
        });
        
        it("should do nothing when type is not 'complex'", () => {
            const attribute = new Attribute("string", "test");
            const before = JSON.parse(JSON.stringify(attribute));
            const after = JSON.parse(JSON.stringify(attribute.truncate()));
            
            assert.deepStrictEqual(after, before,
                "Instance method 'truncate' modified non-complex attribute");
        });
        
        it("should remove specified sub-attribute from 'subAttributes' collection", async () => {
            const {truncate: suite} = await fixtures;
            
            for (let fixture of suite) {
                const attribute = instantiateFromFixture(fixture);
                const comparison = {...fixture, subAttributes: [...fixture.subAttributes ?? []]};
                const target = comparison.subAttributes.shift()?.name;
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(attribute.truncate(target))), comparison,
                    `Attribute 'truncate' fixture #${suite.indexOf(fixture) + 1} did not remove specified sub-attribute '${target}'`);
            }
        });
    });
    
    describe("#coerce()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new Attribute("string", "test")).coerce === "function",
                "Instance method 'coerce' was not defined");
        });
        
        it("should do nothing when 'type' is unrecognised", () => {
            const target = new Attribute("string", "test");
            const get = (t, p) => (p === "type" ? "test" : target[p]);
            const attribute = new Proxy({}, {get});
            const source = {};
            
            assert.strictEqual(attribute.coerce(source), source,
                "Instance method 'coerce' did not do nothing when 'type' was unrecognised");
        });
        
        it("should expect required attributes to have a value", () => {
            for (let type of ["string", "complex", "boolean", "binary", "decimal", "integer", "dateTime", "reference"]) {
                assert.throws(() => new Attribute(type, "test", {required: true}).coerce(),
                    {name: "TypeError", message: "Required attribute 'test' is missing"},
                    `Instance method 'coerce' did not expect required ${type} attribute to have a value`);
                assert.throws(() => new Attribute(type, "test", {required: true}).coerce(null),
                    {name: "TypeError", message: "Required attribute 'test' is missing"},
                    `Instance method 'coerce' did not reject empty value 'null' when ${type} attribute was required`);
                assert.throws(() => new Attribute(type, "test", {required: true, multiValued: true}).coerce(),
                    {name: "TypeError", message: "Required attribute 'test' is missing"},
                    `Instance method 'coerce' did not expect required ${type} attribute to have a value`);
            }
        });
        
        it("should expect value to be an array when attribute is multi-valued", () => {
            const attribute = new Attribute("string", "test", {multiValued: true});
            
            assert.doesNotThrow(() => attribute.coerce(),
                "Instance method 'coerce' rejected empty value when attribute was not required");
            assert.ok(Array.isArray(attribute.coerce([])),
                "Instance method 'coerce' did not produce array when attribute was multi-valued and value was array");
            assert.throws(() => attribute.coerce("a string"),
                {name: "TypeError", message: "Attribute 'test' expected to be a collection"},
                "Instance method 'coerce' did not reject singular value 'a string'");
            assert.throws(() => attribute.coerce({}),
                {name: "TypeError", message: "Attribute 'test' expected to be a collection"},
                "Instance method 'coerce' did not reject singular complex value");
        });
        
        it("should expect value to be singular when attribute is not multi-valued", () => {
            const attribute = new Attribute("string", "test");
            
            assert.doesNotThrow(() => attribute.coerce(),
                "Instance method 'coerce' rejected empty value when attribute was not required");
            assert.throws(() => attribute.coerce(["a string"]),
                {name: "TypeError", message: "Attribute 'test' is not multi-valued and must not be a collection"},
                "Instance method 'coerce' did not reject array value ['a string']");
            assert.throws(() => attribute.coerce([{}]),
                {name: "TypeError", message: "Attribute 'test' is not multi-valued and must not be a collection"},
                "Instance method 'coerce' did not reject array with complex value");
        });
        
        it("should expect value to be canonical when attribute specifies canonicalValues characteristic", () => {
            const attribute = new Attribute("string", "test", {canonicalValues: ["Test"]});
            
            assert.doesNotThrow(() => attribute.coerce(),
                "Instance method 'coerce' rejected empty non-canonical value");
            assert.throws(() => attribute.coerce("a string"),
                {name: "TypeError", message: "Attribute 'test' contains non-canonical value"},
                "Instance method 'coerce' did not reject non-canonical value 'a string'");
            assert.doesNotThrow(() => attribute.coerce("Test"),
                "Instance method 'coerce' rejected canonical value 'Test'");
        });
        
        it("should expect all values to be canonical when attribute is multi-valued and specifies canonicalValues characteristic", () => {
            const attribute = new Attribute("string", "test", {multiValued: true, canonicalValues: ["Test"]});
            const target = attribute.coerce([]);
            
            assert.throws(() => attribute.coerce(["a string"]),
                {name: "TypeError", message: "Attribute 'test' contains non-canonical value"},
                "Instance method 'coerce' did not reject non-canonical value 'a string' by itself");
            assert.throws(() => attribute.coerce(["Test", "a string"]),
                {name: "TypeError", message: "Attribute 'test' contains non-canonical value"},
                `Instance method 'coerce' did not reject non-canonical value 'a string' with canonical value 'Test'`);
            assert.doesNotThrow(() => attribute.coerce(["Test"]),
                "Instance method 'coerce' rejected canonical value 'Test'");
            assert.throws(() => target.push("a string"),
                {name: "TypeError", message: "Attribute 'test' does not include canonical value 'a string'"},
                "Instance method 'coerce' did not reject addition of non-canonical value 'a string' to coerced collection");
        });
        
        it("should expect value to be a string when attribute type is 'string'", () => (
            typedCoercion("string", {
                valid: [["string value 'a string'", "a string"]],
                invalid: [
                    ["number value '1'", "number", 1],
                    ["complex value", "complex", {}],
                    ["boolean value 'false'", "boolean", false],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect all values to be strings when attribute is multi-valued and type is 'string'", () => (
            typedCoercion("string", {
                multiValued: true,
                valid: [["string value 'a string'", "a string"]],
                invalid: [
                    ["number value '1'", "number", 1],
                    ["complex value", "complex", {}],
                    ["boolean value 'false'", "boolean", false],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect value to be either true or false when attribute type is 'boolean'", () => (
            typedCoercion("boolean", {
                valid: [["boolean value 'true'", true], ["boolean value 'false'", false]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["number value '1'", "number", 1],
                    ["complex value", "complex", {}],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect all values to be either true or false when attribute is multi-valued and type is 'boolean'", () => (
            typedCoercion("boolean", {
                multiValued: true,
                valid: [["boolean value 'true'", true], ["boolean value 'false'", false]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["number value '1'", "number", 1],
                    ["complex value", "complex", {}],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect value to be a decimal number when attribute type is 'decimal'", () => (
            typedCoercion("decimal", {
                valid: [["decimal value '1.0'", Number(1.0).toFixed(1)], ["decimal value '1.01'", 1.01]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["integer value '1'", "integer", 1],
                    ["boolean value 'false'", "boolean", false],
                    ["complex value", "complex", {}],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect all values to be decimal numbers when attribute is multi-valued and type is 'decimal'", () => (
            typedCoercion("decimal", {
                multiValued: true,
                valid: [["decimal value '1.0'", Number(1.0).toFixed(1)], ["decimal value '1.01'", 1.01]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["integer value '1'", "integer", 1],
                    ["boolean value 'false'", "boolean", false],
                    ["complex value", "complex", {}],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect value to be an integer number when attribute type is 'integer'", () => (
            typedCoercion("integer", {
                valid: [["integer value '1'", 1]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["decimal value '1.01'", "decimal", 1.01],
                    ["boolean value 'false'", "boolean", false],
                    ["complex value", "complex", {}],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect all values to be integer numbers when attribute is multi-valued and type is 'integer'", () => (
            typedCoercion("integer", {
                multiValued: true,
                valid: [["integer value '1'", 1]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["decimal value '1.01'", "decimal", 1.01],
                    ["boolean value 'false'", "boolean", false],
                    ["complex value", "complex", {}],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect value to be a valid date instance or date string when attribute type is 'dateTime'", () => (
            typedCoercion("dateTime", {
                valid: [["date instance value", new Date()], ["date string value", new Date().toISOString()]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["number value '1'", "number", 1],
                    ["boolean value 'false'", "boolean", false],
                    ["complex value", "complex", {}]
                ]
            })
        ));
        
        it("should expect all values to be valid date instances or date strings when attribute is multi-valued and type is 'dateTime'", () => (
            typedCoercion("dateTime", {
                multiValued: true,
                valid: [["date instance value", new Date()], ["date string value", new Date().toISOString()]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["number value '1'", "number", 1],
                    ["boolean value 'false'", "boolean", false],
                    ["complex value", "complex", {}]
                ]
            })
        ));
        
        it("should expect value to be a valid reference when attribute type is 'reference'", () => {
            assert.throws(() => new Attribute("reference", "test").coerce("a string"),
                {name: "TypeError", message: "Attribute 'test' with type 'reference' does not specify any referenceTypes"},
                "Instance method 'coerce' did not expect reference value when attribute type was reference");
            
            typedCoercion("reference", {
                config: {referenceTypes: ["uri", "external"]},
                valid: [["external reference value", "https://example.com"], ["URI reference value", "urn:ietf:params:scim:schemas:Test"]],
                invalid: [
                    ["number value '1'", "number", 1],
                    ["boolean value 'false'", "boolean", false],
                    ["complex value", "complex", {}],
                    ["Date instance value", "dateTime", new Date()]
                ]
            });
        });
        
        it("should expect all values to be valid references when attribute is multi-valued and type is 'reference'", () => {
            assert.throws(() => new Attribute("reference", "test", {multiValued: true}).coerce([]).push("a string"),
                {name: "TypeError", message: "Attribute 'test' with type 'reference' does not specify any referenceTypes"},
                "Instance method 'coerce' did not expect reference value when attribute type was reference");
            
            typedCoercion("reference", {
                multiValued: true,
                config: {referenceTypes: ["uri", "external"]},
                valid: [["external reference value", "https://example.com"], ["URI reference value", "urn:ietf:params:scim:schemas:Test"]],
                invalid: [
                    ["number value '1'", "number", 1],
                    ["boolean value 'false'", "boolean", false],
                    ["complex value", "complex", {}],
                    ["Date instance value", "dateTime", new Date()]
                ]
            });
        });
        
        it("should expect value to be a base64 encoded string when attribute type is 'binary'", () => (
            typedCoercion("binary", {
                assertion: (type) => (["complex", "dateTime"].includes(type) ? (
                    `Attribute 'test' expected value type 'binary' but found type '${type}'`
                ) : (
                    "Attribute 'test' expected value type 'binary' to be base64 encoded string or binary octet stream"
                )),
                valid: [["string value 'a string'", "a string"]],
                invalid: [
                    ["number value '1'", "number", 1],
                    ["complex value", "complex", {}],
                    ["boolean value 'false'", "boolean", false],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect all values to be base64 encoded strings when attribute is multi-valued and type is 'binary'", () => (
            typedCoercion("binary", {
                multiValued: true,
                assertion: (type) => (["complex", "dateTime"].includes(type) ? (
                    `Attribute 'test' expected value type 'binary' but found type '${type}'`
                ) : (
                    "Attribute 'test' expected value type 'binary' to be base64 encoded string or binary octet stream"
                )),
                valid: [["string value 'a string'", "a string"]],
                invalid: [
                    ["number value '1'", "number", 1],
                    ["complex value", "complex", {}],
                    ["boolean value 'false'", "boolean", false],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect value to be an object when attribute type is 'complex'", () => (
            typedCoercion("complex", {
                assertion: (type) => `Complex attribute 'test' expected complex value but found type '${type}'`,
                valid: [["complex value", {}]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["number value '1'", "number", 1],
                    ["boolean value 'false'", "boolean", false],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
        
        it("should expect all values to be objects when attribute is multi-valued and type is 'complex'", () => (
            typedCoercion("complex", {
                multiValued: true,
                assertion: (type) => `Complex attribute 'test' expected complex value but found type '${type}'`,
                valid: [["complex value", {}]],
                invalid: [
                    ["string value 'a string'", "string", "a string"],
                    ["number value '1'", "number", 1],
                    ["boolean value 'false'", "boolean", false],
                    ["Date instance value", "dateTime", new Date()]
                ]
            })
        ));
    });
});