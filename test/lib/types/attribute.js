import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";

export function instantiateFromFixture(SCIMMY, fixture) {
    let {type, name, mutability: m, uniqueness: u, subAttributes = [], ...config} = fixture;
    
    return new SCIMMY.Types.Attribute(
        type, name, {...(m !== undefined ? {mutable: m} : {}), ...(u !== null ? {uniqueness: !u ? false : u} : {}), ...config}, 
        subAttributes.map((a) => instantiateFromFixture(SCIMMY, a))
    );
}

export let AttributeSuite = (SCIMMY) => {
    const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
    const fixtures = fs.readFile(path.join(basepath, "./attribute.json"), "utf8").then((f) => JSON.parse(f));
    
    it("should include static class 'Attribute'", () => 
        assert.ok(!!SCIMMY.Types.Attribute, "Static class 'Attribute' not defined"));
    
    describe("SCIMMY.Types.Attribute", () => {
        it("should require valid 'type' argument at instantiation", () => {
            assert.throws(() => new SCIMMY.Types.Attribute(),
                {name: "TypeError", message: "Required parameter 'type' missing from Attribute instantiation"},
                "Attribute instantiated without 'type' argument");
            assert.throws(() => new SCIMMY.Types.Attribute("other", "other"),
                {name: "TypeError", message: "Type 'other' not recognised in attribute definition 'other'"},
                "Attribute instantiated with unknown 'type' argument");
        });
        
        it("should require valid 'name' argument at instantiation", () => {
            assert.throws(() => new SCIMMY.Types.Attribute("string"),
                {name: "TypeError", message: "Required parameter 'name' missing from Attribute instantiation"},
                "Attribute instantiated without 'name' argument");
            
            let invalidNames = [
                [".", "invalid.name"],
                ["@", "invalid@name"],
                ["=", "invalid=name"], 
                ["%", "invalid%name"]
            ];
            
            for (let [char, name] of invalidNames) {
                assert.throws(() => new SCIMMY.Types.Attribute("string", name),
                    {name: "TypeError", message: `Invalid character '${char}' in name of attribute definition '${name}'`},
                    "Attribute instantiated with invalid 'name' argument");
            }
            
            assert.ok(new SCIMMY.Types.Attribute("string", "validName"),
                "Attribute did not instantiate with valid 'name' argument");
        });
        
        it("should not accept 'subAttributes' argument if type is not 'complex'", () => {
            assert.throws(() => new SCIMMY.Types.Attribute("string", "test", {}, [new SCIMMY.Types.Attribute("string", "other")]),
                {name: "TypeError", message: "Attribute type must be 'complex' when subAttributes are specified in attribute definition 'test'"},
                "Attribute instantiated with subAttributes when type was not 'complex'");
        });
        
        for (let attrib of ["canonicalValues", "referenceTypes"]) {
            it(`should not accept invalid '${attrib}' configuration values`, () => {
                for (let value of ["a string", true]) {
                    assert.throws(() => new SCIMMY.Types.Attribute("string", "test", {[attrib]: value}),
                        {name: "TypeError", message: `Attribute '${attrib}' value must be either a collection or 'false' in attribute definition 'test'`},
                        `Attribute instantiated with invalid '${attrib}' configuration value '${value}'`);
                }
            });
        }
        
        for (let [attrib, name = attrib] of [["mutable", "mutability"], ["returned"], ["uniqueness"]]) {
            it(`should not accept invalid '${attrib}' configuration values`, () => {
                assert.throws(() => new SCIMMY.Types.Attribute("string", "test", {[attrib]: "a string"}),
                    {name: "TypeError", message: `Attribute '${name}' value 'a string' not recognised in attribute definition 'test'`},
                    `Attribute instantiated with invalid '${attrib}' configuration value 'a string'`);
                assert.throws(() => new SCIMMY.Types.Attribute("string", "test", {[attrib]: 1}),
                    {name: "TypeError", message: `Attribute '${name}' value must be either string or boolean in attribute definition 'test'`},
                    `Attribute instantiated with invalid '${attrib}' configuration number value '1'`);
                assert.throws(() => new SCIMMY.Types.Attribute("string", "test", {[attrib]: {}}),
                    {name: "TypeError", message: `Attribute '${name}' value must be either string or boolean in attribute definition 'test'`},
                    `Attribute instantiated with invalid '${attrib}' configuration complex value`);
                assert.throws(() => new SCIMMY.Types.Attribute("string", "test", {[attrib]: new Date()}),
                    {name: "TypeError", message: `Attribute '${name}' value must be either string or boolean in attribute definition 'test'`},
                    `Attribute instantiated with invalid '${attrib}' configuration date value`);
            });
        }
        
        it("should be frozen after instantiation", () => {
            let attribute = new SCIMMY.Types.Attribute("string", "test");
            
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
        
        describe("#toJSON()", () => {
            it("should have instance method 'toJSON'", () => {
                assert.ok(typeof (new SCIMMY.Types.Attribute("string", "test")).toJSON === "function",
                    "Instance method 'toJSON' not defined");
            });
            
            it("should produce valid SCIM attribute definition objects", async () => {
                let {toJSON: suite} = await fixtures;
                
                for (let fixture of suite) {
                    let attribute = instantiateFromFixture(SCIMMY, fixture);
                    
                    assert.deepStrictEqual(JSON.parse(JSON.stringify(attribute)), fixture, 
                        `Attribute 'toJSON' fixture #${suite.indexOf(fixture)+1} did not produce valid SCIM attribute definition object`);
                }
            });
        });
        
        describe("#truncate()", () => {
            it("should have instance method 'truncate'", () => {
                assert.ok(typeof (new SCIMMY.Types.Attribute("string", "test")).truncate === "function",
                    "Instance method 'truncate' not defined");
            });
            
            it("should do nothing without arguments", async () => {
                let {truncate: suite} = await fixtures;
                
                for (let fixture of suite) {
                    let attribute = instantiateFromFixture(SCIMMY, fixture);
                    
                    assert.deepStrictEqual(JSON.parse(JSON.stringify(attribute.truncate())), fixture,
                        `Attribute 'truncate' fixture #${suite.indexOf(fixture)+1} modified attribute without arguments`);
                }
            });
            
            it("should do nothing when type is not 'complex'", () => {
                let attribute = new SCIMMY.Types.Attribute("string", "test"),
                    before = JSON.parse(JSON.stringify(attribute)),
                    after = JSON.parse(JSON.stringify(attribute.truncate()));
                
                assert.deepStrictEqual(after, before,
                    "Instance method 'truncate' modified non-complex attribute");
            });
            
            it("should remove specified sub-attribute from 'subAttributes' collection", async () => {
                let {truncate: suite} = await fixtures;
                
                for (let fixture of suite) {
                    let attribute = instantiateFromFixture(SCIMMY, fixture),
                        comparison = {...fixture, subAttributes: [...fixture.subAttributes ?? []]},
                        target = comparison.subAttributes.shift()?.name;
                    
                    assert.deepStrictEqual(JSON.parse(JSON.stringify(attribute.truncate(target))), comparison,
                        `Attribute 'truncate' fixture #${suite.indexOf(fixture) + 1} did not remove specified sub-attribute '${target}'`);
                }
            });
        });
        
        describe("#coerce()", () => {
            it("should have instance method 'coerce'", () => {
                assert.ok(typeof (new SCIMMY.Types.Attribute("string", "test")).coerce === "function",
                    "Instance method 'coerce' not defined");
            });
            
            // TODO: characteristic-specific attribute coercion tests
            // TODO: type-specific attribute coercion tests
        });
    });
}