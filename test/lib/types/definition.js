import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import {instantiateFromFixture} from "./attribute.js";

export let SchemaDefinitionSuite = (SCIMMY) => {
    const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
    const fixtures = fs.readFile(path.join(basepath, "./definition.json"), "utf8").then((f) => JSON.parse(f));
    const params = {name: "Test", id: "urn:ietf:params:scim:schemas:Test"};
    
    it("should include static class 'SchemaDefinition'", () => 
        assert.ok(!!SCIMMY.Types.SchemaDefinition, "Static class 'SchemaDefinition' not defined"));
    
    describe("SCIMMY.Types.SchemaDefinition", () => {
        it("should require valid 'name' argument at instantiation", () => {
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition()),
                {name: "TypeError", message: "Required parameter 'name' missing from SchemaDefinition instantiation"},
                "SchemaDefinition instantiated without 'name' parameter");
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition("")),
                {name: "TypeError", message: "Expected 'name' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with empty string 'name' parameter");
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition(false)),
                {name: "TypeError", message: "Expected 'name' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with 'name' parameter boolean value 'false'");
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition({})),
                {name: "TypeError", message: "Expected 'name' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with complex object 'name' parameter value");
        });
        
        it("should require valid 'id' argument at instantiation", () => {
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition("Test")),
                {name: "TypeError", message: "Required parameter 'id' missing from SchemaDefinition instantiation"},
                "SchemaDefinition instantiated without 'id' parameter");
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition("Test", "")),
                {name: "TypeError", message: "Expected 'id' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with empty string 'id' parameter");
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition("Test", false)),
                {name: "TypeError", message: "Expected 'id' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with 'id' parameter boolean value 'false'");
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition("Test", {})),
                {name: "TypeError", message: "Expected 'id' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with complex object 'id' parameter value");
        });
        
        it("should require 'id' to start with 'urn:ietf:params:scim:schemas:' at instantiation", () => {
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition("Test", "test")),
                {name: "TypeError", message: "Invalid SCIM schema URN namespace 'test' in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with invalid 'id' parameter value 'test'");
        });
        
        it("should require valid 'description' argument at instantiation", () => {
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition(...Object.values(params), false)),
                {name: "TypeError", message: "Expected 'description' to be a string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with 'description' parameter boolean value 'false'");
            assert.throws(() => (new SCIMMY.Types.SchemaDefinition(...Object.values(params), {})),
                {name: "TypeError", message: "Expected 'description' to be a string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with complex object 'description' parameter value");
        });
        
        it("should have instance member 'name'", () => {
            assert.strictEqual((new SCIMMY.Types.SchemaDefinition(...Object.values(params)))?.name, params.name,
                "SchemaDefinition did not include instance member 'name'");
        });
        
        it("should have instance member 'id'", () => {
            assert.strictEqual((new SCIMMY.Types.SchemaDefinition(...Object.values(params)))?.id, params.id,
                "SchemaDefinition did not include instance member 'id'");
        });
    
        it("should have instance member 'description'", () => {
            assert.ok("description" in (new SCIMMY.Types.SchemaDefinition(...Object.values(params))),
                "SchemaDefinition did not include instance member 'description'");
        });
        
        it("should have instance member 'attributes' that is an array", () => {
            let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params));
            
            assert.ok("attributes" in definition,
                "SchemaDefinition did not include instance member 'attributes'");
            assert.ok(Array.isArray(definition.attributes),
                "SchemaDefinition instance member 'attributes' was not an array");
        });
        
        describe("#describe()", () => {
            it("should have instance method 'describe'", () => {
                assert.ok(typeof (new SCIMMY.Types.SchemaDefinition(...Object.values(params))).describe === "function",
                    "Instance method 'describe' not defined");
            });
            
            it("should produce valid SCIM schema definition objects", async () => {
                let {describe: suite} = await fixtures;
                
                for (let fixture of suite) {
                    let definition = new SCIMMY.Types.SchemaDefinition(
                        fixture.source.name, fixture.source.id, fixture.source.description, 
                        fixture.source.attributes.map((a) => instantiateFromFixture(SCIMMY, a))
                    );
                    
                    assert.deepStrictEqual(JSON.parse(JSON.stringify(definition.describe())), fixture.target,
                        `SchemaDefinition 'describe' fixture #${suite.indexOf(fixture)+1} did not produce valid SCIM schema definition object`);
                }
            });
        });
        
        describe("#attribute()", () => {
            it("should have instance method 'attribute'", () => {
                assert.ok(typeof (new SCIMMY.Types.SchemaDefinition(...Object.values(params))).attribute === "function",
                    "Instance method 'attribute' not defined");
            });
            
            it("should find attributes by name", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    attribute = definition.attribute("id");
                
                assert.ok(attribute !== undefined, 
                    "Instance method 'attribute' did not return anything");
                assert.ok(attribute instanceof SCIMMY.Types.Attribute,
                    "Instance method 'attribute' did not return an instance of 'SCIMMY.Types.Attribute'");
                assert.strictEqual(attribute.name, "id",
                    "Instance method 'attribute' did not find attribute with name 'id'");
            });
            
            it("should expect attributes to exist", () => {
                assert.throws(() => (new SCIMMY.Types.SchemaDefinition(...Object.values(params))).attribute("test"),
                    {name: "TypeError", message: `Schema definition '${params.id}' does not declare attribute 'test'`},
                    "Instance method 'attribute' did not expect attribute 'test' to exist");
            });
            
            it("should ignore case of 'name' argument when finding attributes", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    attribute = definition.attribute("id");
                
                assert.strictEqual(definition.attribute("ID"), attribute,
                    "Instance method 'attribute' did not ignore case of 'name' argument when finding attributes");
            });
            
            it("should find sub-attributes by name", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    attribute = definition.attribute("meta.resourceType");
                
                assert.ok(attribute !== undefined,
                    "Instance method 'attribute' did not return anything");
                assert.ok(attribute instanceof SCIMMY.Types.Attribute,
                    "Instance method 'attribute' did not return an instance of 'SCIMMY.Types.Attribute'");
                assert.strictEqual(attribute.name, "resourceType",
                    "Instance method 'attribute' did not find sub-attribute with name 'resourceType'");
            });
            
            it("should expect sub-attributes to exist", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params));
                
                assert.throws(() => definition.attribute("id.test"),
                    {name: "TypeError", message: `Attribute 'id' of schema '${params.id}' is not of type 'complex' and does not define any subAttributes`},
                    "Instance method 'attribute' did not expect sub-attribute 'id.test' to exist");
                assert.throws(() => definition.attribute("meta.test"),
                    {name: "TypeError", message: `Attribute 'meta' of schema '${params.id}' does not declare subAttribute 'test'`},
                    "Instance method 'attribute' did not expect sub-attribute 'meta.test' to exist");
            });
            
            it("should ignore case of 'name' argument when finding sub-attributes", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    attribute = definition.attribute("meta.resourceType");
                
                assert.strictEqual(definition.attribute("Meta.ResourceType"), attribute,
                    "Instance method 'attribute' did not ignore case of 'name' argument when finding sub-attributes");
            });
            
            it("should find namespaced attributes", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    attribute = definition.attribute(`${params.id}:id`);
                
                assert.ok(attribute !== undefined,
                    "Instance method 'attribute' did not return anything");
                assert.ok(attribute instanceof SCIMMY.Types.Attribute,
                    "Instance method 'attribute' did not return an instance of 'SCIMMY.Types.Attribute'");
                assert.strictEqual(attribute.name, "id",
                    "Instance method 'attribute' did not find namespaced attribute with name 'id'");
            });
            
            it("should expect namespaced attributes to exist", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params));
                
                assert.throws(() => definition.attribute(`${params.id}:test`),
                    {name: "TypeError", message: `Schema definition '${params.id}' does not declare attribute 'test'`},
                    `Instance method 'attribute' did not expect namespaced attribute '${params.id}:test' to exist`);
                assert.throws(() => definition.attribute(`${params.id}:id.test`),
                    {name: "TypeError", message: `Attribute 'id' of schema '${params.id}' is not of type 'complex' and does not define any subAttributes`},
                    `Instance method 'attribute' did not expect namespaced attribute '${params.id}:id.test' to exist`);
                assert.throws(() => definition.attribute(`${params.id}:meta.test`),
                    {name: "TypeError", message: `Attribute 'meta' of schema '${params.id}' does not declare subAttribute 'test'`},
                    `Instance method 'attribute' did not expect namespaced attribute '${params.id}:meta.test' to exist`);
                assert.throws(() => definition.attribute(`${params.id}Extension:test`),
                    {name: "TypeError", message: `Schema definition '${params.id}' does not declare schema extension for namespaced target '${params.id}Extension:test'`},
                    `Instance method 'attribute' did not expect schema extension namespace for attribute '${params.id}Extension:test' to exist`);
            });
            
            it("should ignore case of 'name' argument when finding namespaced attributes", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    attribute = definition.attribute(`${params.id}:id`);
                
                assert.strictEqual(definition.attribute(String(`${params.id}:id`).toUpperCase()), attribute,
                    "Instance method 'attribute' did not ignore case of 'name' argument when finding namespaced attributes");
            });
        });
        
        describe("#extend()", () => {
            it("should have instance method 'extend'", () => {
                assert.ok(typeof (new SCIMMY.Types.SchemaDefinition(...Object.values(params))).extend === "function",
                    "Instance method 'extend' not defined");
            });
            
            it("should expect 'extension' argument to be an instance of SchemaDefinition or collection of Attribute instances", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params));
                
                assert.throws(() => definition.extend({}),
                    {name: "TypeError", message: "Expected 'extension' to be a SchemaDefinition or collection of Attribute instances"},
                    "Instance method 'extend' did not expect 'extension' argument to be an instance of SchemaDefinition or collection of Attribute instances");
                assert.throws(() => definition.extend([new SCIMMY.Types.Attribute("string", "test"), {}]),
                    {name: "TypeError", message: "Expected 'extension' to be a SchemaDefinition or collection of Attribute instances"},
                    "Instance method 'extend' did not expect 'extension' argument to be an instance of SchemaDefinition or collection of Attribute instances");
                assert.throws(() => definition.extend([new SCIMMY.Types.Attribute("string", "test"), SCIMMY.Schemas.User.definition]),
                    {name: "TypeError", message: "Expected 'extension' to be a SchemaDefinition or collection of Attribute instances"},
                    "Instance method 'extend' did not expect 'extension' argument to be an instance of SchemaDefinition or collection of Attribute instances");
            });
            
            it("should expect all attribute extensions to have unique names", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params));
                
                assert.throws(() => definition.extend(new SCIMMY.Types.Attribute("string", "id")),
                    {name: "TypeError", message: `Schema definition '${params.id}' already declares attribute 'id'`},
                    "Instance method 'extend' did not expect Attribute instances in 'extension' argument to have unique names");
            });
            
            it("should do nothing when Attribute instance extensions are already included in the schema definition", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    extension = new SCIMMY.Types.Attribute("string", "test"),
                    attribute = definition.attribute("id");
                
                assert.strictEqual(definition.extend([attribute, extension]).attribute("id"), attribute,
                    "Instance method 'extend' did not ignore already included Attribute instance extension");
                assert.strictEqual(definition.extend(extension).attribute("test"), extension,
                    "Instance method 'extend' did not ignore already included Attribute instance extension");
            });
            
            it("should expect all schema definition extensions to have unique IDs", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    extension = new SCIMMY.Types.SchemaDefinition("ExtensionTest", SCIMMY.Schemas.User.definition.id);
                
                assert.throws(() => definition.extend(SCIMMY.Schemas.User.definition).extend(extension),
                    {name: "TypeError", message: `Schema definition '${params.id}' already declares extension '${SCIMMY.Schemas.User.definition.id}'`},
                    "Instance method 'extend' did not expect 'extension' argument of type SchemaDefinition to have unique id");
            });
            
            it("should do nothing when SchemaDefinition instances are already declared as extensions to the schema definition", () => {
                let extension = new SCIMMY.Types.SchemaDefinition(`${params.name}Extension`, `${params.id}Extension`),
                    definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)).extend(extension);
                
                assert.strictEqual(Object.getPrototypeOf(definition.extend(extension).attribute(extension.id)), extension,
                    "Instance method 'extend' did not ignore already declared SchemaDefinition extension");
            });
        });
        
        describe("#truncate()", () => {
            it("should have instance method 'truncate'", () => {
                assert.ok(typeof (new SCIMMY.Types.SchemaDefinition(...Object.values(params))).truncate === "function",
                    "Instance method 'truncate' not defined");
            });
            
            it("should do nothing without arguments", async () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    expected = JSON.parse(JSON.stringify(definition.describe())),
                    actual = JSON.parse(JSON.stringify(definition.truncate().describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' modified attributes without arguments");
            });
            
            it("should do nothing when definition does not directly include Attribute instances in 'attributes' argument", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params)),
                    expected = JSON.parse(JSON.stringify(definition.describe())),
                    attribute = new SCIMMY.Types.Attribute("string", "id"),
                    actual = JSON.parse(JSON.stringify(definition.truncate(attribute).describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not do nothing when foreign Attribute instance supplied in 'attributes' parameter");
            });
            
            it("should remove Attribute instances directly included in the definition", () => {
                let attribute = new SCIMMY.Types.Attribute("string", "test"),
                    definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params), "", [attribute]),
                    expected = JSON.parse(JSON.stringify({...definition.describe(), attributes: []})),
                    actual = JSON.parse(JSON.stringify(definition.truncate(attribute).describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not remove Attribute instances directly included in the definition's attributes");
            });
            
            it("should remove named attributes directly included in the definition", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params), "", [new SCIMMY.Types.Attribute("string", "test")]),
                    expected = JSON.parse(JSON.stringify({...definition.describe(), attributes: []})),
                    actual = JSON.parse(JSON.stringify(definition.truncate("test").describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not remove named attribute directly included in the definition");
            });
            
            it("should expect named attributes and sub-attributes to exist", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params));
                
                assert.throws(() => definition.truncate("test"),
                    {name: "TypeError", message: `Schema definition '${params.id}' does not declare attribute 'test'`},
                    "Instance method 'truncate' did not expect named attribute 'test' to exist");
                assert.throws(() => definition.truncate("id.test"),
                    {name: "TypeError", message: `Attribute 'id' of schema '${params.id}' is not of type 'complex' and does not define any subAttributes`},
                    "Instance method 'truncate' did not expect named sub-attribute 'id.test' to exist");
                assert.throws(() => definition.truncate("meta.test"),
                    {name: "TypeError", message: `Attribute 'meta' of schema '${params.id}' does not declare subAttribute 'test'`},
                    "Instance method 'truncate' did not expect named sub-attribute 'meta.test' to exist");
            });
        });
        
        describe("#coerce()", () => {
            it("should have instance method 'coerce'", () => {
                assert.ok(typeof (new SCIMMY.Types.SchemaDefinition(...Object.values(params))).coerce === "function",
                    "Instance method 'coerce' not defined");
            });
            
            it("should expect 'data' argument to be an object", () => {
                let definition = new SCIMMY.Types.SchemaDefinition(...Object.values(params));
                
                assert.throws(() => definition.coerce(),
                    {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                    "Instance method 'coerce' did not expect 'data' argument to be defined");
                assert.throws(() => definition.coerce("a string"),
                    {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                    "Instance method 'coerce' proceeded on 'data' argument with string value 'a string'");
                assert.throws(() => definition.coerce([]),
                    {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                    "Instance method 'coerce' proceeded on 'data' argument with string value 'a string'");
            });
            
            // TODO: verify common attributes are set by coerce method
            // TODO: verify coerce is called on directly included attributes
            // TODO: verify namespaced attributes or extensions are coerced correctly
            // TODO: verify attribute filter is applied to coerced result
        });
    });
}