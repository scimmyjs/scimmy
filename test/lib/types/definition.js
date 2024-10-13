import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import sinon from "sinon";
import SCIMMY from "#@/scimmy.js";
import {SchemaDefinition} from "#@/lib/types/definition.js";
import {Attribute} from "#@/lib/types/attribute.js";
import {Filter} from "#@/lib/types/filter.js";
import {instantiateFromFixture} from "./attribute.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./definition.json"), "utf8").then((f) => JSON.parse(f));
// Default parameter values to use in tests
const params = {name: "Test", id: "urn:ietf:params:scim:schemas:Test"};
const extensionId = params.id.replace("Test", "Extension");

describe("SCIMMY.Types.SchemaDefinition", () => {
    describe("@constructor", () => {
        it("should expect 'name' argument to be defined", () => {
            assert.throws(() => (new SchemaDefinition()),
                {name: "TypeError", message: "Required parameter 'name' missing from SchemaDefinition instantiation"},
                "SchemaDefinition instantiated without 'name' parameter");
            assert.throws(() => (new SchemaDefinition("")),
                {name: "TypeError", message: "Expected 'name' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with empty string 'name' parameter");
            assert.throws(() => (new SchemaDefinition(false)),
                {name: "TypeError", message: "Expected 'name' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with 'name' parameter boolean value 'false'");
            assert.throws(() => (new SchemaDefinition({})),
                {name: "TypeError", message: "Expected 'name' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with complex object 'name' parameter value");
        });
        
        it("should require valid 'id' argument", () => {
            assert.throws(() => (new SchemaDefinition("Test")),
                {name: "TypeError", message: "Required parameter 'id' missing from SchemaDefinition instantiation"},
                "SchemaDefinition instantiated without 'id' parameter");
            assert.throws(() => (new SchemaDefinition("Test", "")),
                {name: "TypeError", message: "Expected 'id' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with empty string 'id' parameter");
            assert.throws(() => (new SchemaDefinition("Test", false)),
                {name: "TypeError", message: "Expected 'id' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with 'id' parameter boolean value 'false'");
            assert.throws(() => (new SchemaDefinition("Test", {})),
                {name: "TypeError", message: "Expected 'id' to be a non-empty string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with complex object 'id' parameter value");
        });
        
        it("should require 'id' to start with 'urn:ietf:params:scim:schemas:'", () => {
            assert.throws(() => (new SchemaDefinition("Test", "test")),
                {name: "TypeError", message: "Invalid SCIM schema URN namespace 'test' in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with invalid 'id' parameter value 'test'");
        });
        
        it("should require valid 'description' argument", () => {
            assert.throws(() => (new SchemaDefinition(...Object.values(params), false)),
                {name: "TypeError", message: "Expected 'description' to be a string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with 'description' parameter boolean value 'false'");
            assert.throws(() => (new SchemaDefinition(...Object.values(params), {})),
                {name: "TypeError", message: "Expected 'description' to be a string in SchemaDefinition instantiation"},
                "SchemaDefinition instantiated with complex object 'description' parameter value");
        });
    });
    
    describe("#name", () => {
        it("should be defined", () => {
            assert.ok("name" in new SchemaDefinition(...Object.values(params)),
                "Instance member 'name' was not defined");
        });
        
        it("should be a string", () => {
            assert.ok(typeof new SchemaDefinition(...Object.values(params))?.name === "string",
                "Instance member 'name' was not a string");
        });
        
        it("should equal 'name' argument supplied at instantiation", () => {
            assert.strictEqual(new SchemaDefinition(...Object.values(params))?.name, params.name,
                "Instance member 'name' did not equal 'name' argument supplied at instantiation");
        });
    });
    
    describe("#id", () => {
        it("should be defined", () => {
            assert.ok("id" in new SchemaDefinition(...Object.values(params)),
                "Instance member 'id' was not defined");
        });
    
        it("should be a string", () => {
            assert.ok(typeof new SchemaDefinition(...Object.values(params))?.id === "string",
                "Instance member 'id' was not a string");
        });
        
        it("should equal 'id' argument supplied at instantiation", () => {
            assert.strictEqual(new SchemaDefinition(...Object.values(params))?.id, params.id,
                "Instance member 'id' did not equal 'id' argument supplied at instantiation");
        });
    });
    
    describe("#description", () => {
        it("should be defined", () => {
            assert.ok("description" in new SchemaDefinition(...Object.values(params)),
                "Instance member 'description' was not defined");
        });
    
        it("should be a string", () => {
            assert.ok(typeof new SchemaDefinition(...Object.values(params))?.description === "string",
                "Instance member 'description' was not a string");
        });
    
        it("should equal 'description' argument supplied at instantiation", () => {
            assert.strictEqual(new SchemaDefinition(...Object.values(params), "Test Description")?.description, "Test Description",
                "Instance member 'description' did not equal 'description' argument supplied at instantiation");
        });
    });
    
    describe("#attributes", () => {
        it("should be defined", () => {
            assert.ok("attributes" in new SchemaDefinition(...Object.values(params)),
                "Instance member 'attributes' was not defined");
        });
        
        it("should be an array", () => {
            assert.ok(Array.isArray(new SchemaDefinition(...Object.values(params))?.attributes),
                "Instance member 'attributes' was not an array");
        });
    });
    
    describe("#describe()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new SchemaDefinition(...Object.values(params))).describe === "function",
                "Instance method 'describe' was not implemented");
        });
        
        it("should produce valid SCIM schema definition objects", async () => {
            const {describe: suite} = await fixtures;
            
            for (let fixture of suite) {
                const definition = new SchemaDefinition(
                    fixture.source.name, fixture.source.id, fixture.source.description, 
                    fixture.source.attributes.map((a) => instantiateFromFixture(a))
                );
                
                assert.deepStrictEqual(JSON.parse(JSON.stringify(definition.describe())), fixture.target,
                    `SchemaDefinition 'describe' fixture #${suite.indexOf(fixture)+1} did not produce valid SCIM schema definition object`);
            }
        });
    });
    
    describe("#attribute()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new SchemaDefinition(...Object.values(params))).attribute === "function",
                "Instance method 'attribute' was not implemented");
        });
        
        it("should find attributes by name", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            const attribute = definition.attribute("id");
            
            assert.ok(attribute !== undefined, 
                "Instance method 'attribute' did not return anything");
            assert.ok(attribute instanceof Attribute,
                "Instance method 'attribute' did not return an instance of 'Attribute'");
            assert.strictEqual(attribute.name, "id",
                "Instance method 'attribute' did not find attribute with name 'id'");
        });
        
        it("should expect attributes to exist", () => {
            assert.throws(() => (new SchemaDefinition(...Object.values(params))).attribute("test"),
                {name: "TypeError", message: `Schema definition '${params.id}' does not declare attribute 'test'`},
                "Instance method 'attribute' did not expect attribute 'test' to exist");
        });
        
        it("should ignore case of 'name' argument when finding attributes", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            const attribute = definition.attribute("id");
            
            assert.strictEqual(definition.attribute("ID"), attribute,
                "Instance method 'attribute' did not ignore case of 'name' argument when finding attributes");
        });
        
        it("should find sub-attributes by name", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            const attribute = definition.attribute("meta.resourceType");
            
            assert.ok(attribute !== undefined,
                "Instance method 'attribute' did not return anything");
            assert.ok(attribute instanceof Attribute,
                "Instance method 'attribute' did not return an instance of 'Attribute'");
            assert.strictEqual(attribute.name, "resourceType",
                "Instance method 'attribute' did not find sub-attribute with name 'resourceType'");
        });
        
        it("should expect sub-attributes to exist", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            
            assert.throws(() => definition.attribute("id.test"),
                {name: "TypeError", message: `Attribute 'id' of schema '${params.id}' is not of type 'complex' and does not define any subAttributes`},
                "Instance method 'attribute' did not expect sub-attribute 'id.test' to exist");
            assert.throws(() => definition.attribute("meta.test"),
                {name: "TypeError", message: `Attribute 'meta' of schema '${params.id}' does not declare subAttribute 'test'`},
                "Instance method 'attribute' did not expect sub-attribute 'meta.test' to exist");
        });
        
        it("should ignore case of 'name' argument when finding sub-attributes", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            const attribute = definition.attribute("meta.resourceType");
            
            assert.strictEqual(definition.attribute("Meta.ResourceType"), attribute,
                "Instance method 'attribute' did not ignore case of 'name' argument when finding sub-attributes");
        });
        
        it("should find namespaced attributes", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            const attribute = definition.attribute(`${params.id}:id`);
            
            assert.ok(attribute !== undefined,
                "Instance method 'attribute' did not return anything");
            assert.ok(attribute instanceof Attribute,
                "Instance method 'attribute' did not return an instance of 'Attribute'");
            assert.strictEqual(attribute.name, "id",
                "Instance method 'attribute' did not find namespaced attribute with name 'id'");
        });
        
        it("should expect namespaced attributes to exist", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            
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
            const definition = new SchemaDefinition(...Object.values(params));
            const attribute = definition.attribute(`${params.id}:id`);
            
            assert.strictEqual(definition.attribute(String(`${params.id}:id`).toUpperCase()), attribute,
                "Instance method 'attribute' did not ignore case of 'name' argument when finding namespaced attributes");
        });
    });
    
    describe("#extend()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new SchemaDefinition(...Object.values(params))).extend === "function",
                "Instance method 'extend' was not implemented");
        });
        
        it("should expect 'extension' argument to be an instance of SchemaDefinition or collection of Attribute instances", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            
            assert.throws(() => definition.extend({}),
                {name: "TypeError", message: "Expected 'extension' to be a SchemaDefinition or collection of Attribute instances"},
                "Instance method 'extend' did not expect 'extension' argument to be an instance of SchemaDefinition or collection of Attribute instances");
            assert.throws(() => definition.extend([new Attribute("string", "test"), {}]),
                {name: "TypeError", message: "Expected 'extension' to be a SchemaDefinition or collection of Attribute instances"},
                "Instance method 'extend' did not expect 'extension' argument to be an instance of SchemaDefinition or collection of Attribute instances");
            assert.throws(() => definition.extend([new Attribute("string", "test"), SCIMMY.Schemas.User.definition]),
                {name: "TypeError", message: "Expected 'extension' to be a SchemaDefinition or collection of Attribute instances"},
                "Instance method 'extend' did not expect 'extension' argument to be an instance of SchemaDefinition or collection of Attribute instances");
        });
        
        it("should expect all attribute extensions to have unique names", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            
            assert.throws(() => definition.extend(new Attribute("string", "id")),
                {name: "TypeError", message: `Schema definition '${params.id}' already declares attribute 'id'`},
                "Instance method 'extend' did not expect Attribute instances in 'extension' argument to have unique names");
        });
        
        it("should do nothing when Attribute instance extensions are already included in the schema definition", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            const extension = new Attribute("string", "test");
            const attribute = definition.attribute("id");
            
            assert.strictEqual(definition.extend([attribute, extension]).attribute("id"), attribute,
                "Instance method 'extend' did not ignore already included Attribute instance extension");
            assert.strictEqual(definition.extend(extension).attribute("test"), extension,
                "Instance method 'extend' did not ignore already included Attribute instance extension");
        });
        
        it("should expect all schema definition extensions to have unique IDs", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            const extension = new SchemaDefinition("ExtensionTest", SCIMMY.Schemas.User.definition.id);
            
            assert.throws(() => definition.extend(SCIMMY.Schemas.User.definition).extend(extension),
                {name: "TypeError", message: `Schema definition '${params.id}' already declares extension '${SCIMMY.Schemas.User.definition.id}'`},
                "Instance method 'extend' did not expect 'extension' argument of type SchemaDefinition to have unique id");
        });
        
        it("should do nothing when SchemaDefinition instances are already declared as extensions to the schema definition", () => {
            const extension = new SchemaDefinition(`${params.name}Extension`, `${params.id}Extension`);
            const definition = new SchemaDefinition(...Object.values(params)).extend(extension);
            
            assert.strictEqual(Object.getPrototypeOf(definition.extend(extension).attribute(extension.id)), extension,
                "Instance method 'extend' did not ignore already declared SchemaDefinition extension");
        });
    });
    
    describe("#truncate()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new SchemaDefinition(...Object.values(params))).truncate === "function",
                "Instance method 'truncate' was not implemented");
        });
        
        it("should do nothing without arguments", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            const expected = JSON.parse(JSON.stringify(definition.describe()));
            const actual = JSON.parse(JSON.stringify(definition.truncate().describe()));
            
            assert.deepStrictEqual(actual, expected,
                "Instance method 'truncate' modified definition without arguments");
        });
        
        context("when 'targets' argument contains an Attribute instance", () => {
            it("should do nothing when definition does not directly include the instances", () => {
                const definition = new SchemaDefinition(...Object.values(params));
                const expected = JSON.parse(JSON.stringify(definition.describe()));
                const attribute = new Attribute("string", "id");
                const actual = JSON.parse(JSON.stringify(definition.truncate([attribute]).describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not do nothing when foreign Attribute instance supplied in 'attributes' parameter");
            });
            
            it("should remove instances directly included in the definition", () => {
                const attributes = [new Attribute("string", "test"), new Attribute("string", "other")];
                const definition = new SchemaDefinition(...Object.values(params), "", attributes);
                const expected = JSON.parse(JSON.stringify({...definition.describe(), attributes: []}));
                const actual = JSON.parse(JSON.stringify(definition.truncate(attributes).describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not remove Attribute instances directly included in the definition's attributes");
            });
        });
        
        context("when 'targets' argument contains an array of Attribute instances", () => {
            it("should do nothing when definition does not directly include the instances", () => {
                const definition = new SchemaDefinition(...Object.values(params));
                const expected = JSON.parse(JSON.stringify(definition.describe()));
                const attribute = new Attribute("string", "id");
                const actual = JSON.parse(JSON.stringify(definition.truncate([attribute]).describe()));
            
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not do nothing when foreign Attribute instance supplied in 'attributes' parameter");
            });
            
            it("should remove instances directly included in the definition", () => {
                const attributes = [new Attribute("string", "test"), new Attribute("string", "other")];
                const definition = new SchemaDefinition(...Object.values(params), "", attributes);
                const expected = JSON.parse(JSON.stringify({...definition.describe(), attributes: []}));
                const actual = JSON.parse(JSON.stringify(definition.truncate(attributes).describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not remove Attribute instances directly included in the definition's attributes");
            });
        });
        
        context("when 'targets' argument contains a SchemaDefinition instance", () => {
            it("should expect definition to directly include the instance", () => {
                const definition = new SchemaDefinition(...Object.values(params));
                const nested = new SchemaDefinition(params.name, `${params.id}2`);
                
                assert.throws(() => definition.truncate(nested),
                    {name: "TypeError", message: `Schema definition '${params.id}' does not declare schema extension for namespaced target '${params.id}2'`},
                    "Instance method 'truncate' did not expect schema definition instance to exist");
            });
            
            it("should remove instances directly included in the definition", () => {
                const nested = new SchemaDefinition(params.name, `${params.id}2`);
                const definition = new SchemaDefinition(...Object.values(params)).extend(nested);
                const expected = JSON.parse(JSON.stringify({...definition.describe(), attributes: []}));
                const actual = JSON.parse(JSON.stringify(definition.truncate(nested).describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not remove schema definition instances directly included in the definition's attributes");
            });
        });
        
        context("when 'targets' argument contains a string", () => {
            it("should remove named attributes directly included in the definition", () => {
                const definition = new SchemaDefinition(...Object.values(params), "", [new Attribute("string", "test")]);
                const expected = JSON.parse(JSON.stringify({...definition.describe(), attributes: []}));
                const actual = JSON.parse(JSON.stringify(definition.truncate("test").describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not remove named attribute directly included in the definition");
            });
            
            it("should remove named sub-attributes included in the definition", () => {
                const definition = new SchemaDefinition(...Object.values(params), "", [new Attribute("complex", "test", {}, [new Attribute("string", "test")])]);
                const expected = JSON.parse(JSON.stringify({...definition.describe(), attributes: [new Attribute("complex", "test").toJSON()]}));
                const actual = JSON.parse(JSON.stringify(definition.truncate("test.test").describe()));
                
                assert.deepStrictEqual(actual, expected,
                    "Instance method 'truncate' did not remove named sub-attribute included in the definition");
            });
            
            it("should expect named attributes and sub-attributes to exist", () => {
                const definition = new SchemaDefinition(...Object.values(params));
                
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
    });
    
    describe("#coerce()", () => {
        it("should be implemented", () => {
            assert.ok(typeof (new SchemaDefinition(...Object.values(params))).coerce === "function",
                "Instance method 'coerce' was not implemented");
        });
        
        it("should expect 'data' argument to be an object", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            
            assert.throws(() => definition.coerce(),
                {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                "Instance method 'coerce' did not expect 'data' argument to be defined");
            assert.throws(() => definition.coerce("a string"),
                {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                "Instance method 'coerce' did not fail with 'data' argument string value 'a string'");
            assert.throws(() => definition.coerce([]),
                {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                "Instance method 'coerce' did not fail with 'data' argument array value");
        });
        
        it("should expect 'filter' argument to be a Filter instance, if specified", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            
            assert.throws(() => definition.coerce({}, undefined, undefined, "test"),
                {name: "TypeError", message: "Expected 'filter' parameter to be a Filter instance in SchemaDefinition instance"},
                "Instance method 'coerce' did not expect 'filter' argument to be a Filter instance");
        });
        
        it("should expect common attributes to be defined on coerced result", () => {
            const definition = new SchemaDefinition(...Object.values(params));
            const result = definition.coerce({});
            
            assert.ok(Array.isArray(result.schemas) && result.schemas.includes(params.id),
                "Instance method 'coerce' did not set common attribute 'schemas' on coerced result");
            assert.strictEqual(result?.meta?.resourceType, params.name,
                "Instance method 'coerce' did not set common attribute 'meta.resourceType' on coerced result");
        });
        
        it("should always include always returned attributes", () => {
            const source = {name: "Test", value: "False"};
            const attributes = [new Attribute("string", "name", {returned: "always"}), new Attribute("string", "value")];
            const definition = new SchemaDefinition(...Object.values(params), "Test Schema", attributes).truncate(["schemas", "meta"]);
            
            assert.deepStrictEqual({...definition.coerce(source, undefined, undefined, new Filter("name np"))}, source,
                `Instance method 'coerce' did not always include always returned attributes`);
        });
        
        it("should expect coerce to be called on directly included attributes", () => {
            const stub = sinon.stub();
            const get = (t, p) => (p === "coerce" ? (...args) => (stub(...args) ?? t.coerce(...args)) : t[p]);
            const attribute = new Proxy(new Attribute("string", "test", {required: true}), {get});
            const definition = new SchemaDefinition(...Object.values(params), "Test Schema", [attribute]);
            
            // Make sure attribute 'coerce' method was called even if a value wasn't defined for it
            assert.throws(() => definition.coerce({}),
                {name: "TypeError", message: "Required attribute 'test' is missing"},
                "Instance method 'coerce' did not attempt to coerce required attribute 'test'");
            assert.ok(stub.calledWithExactly(undefined, "both"),
                "Instance method 'coerce' did not directly call attribute instance method 'coerce'");
            
            // Make sure attribute 'coerce' method was called when a value was defined for it
            assert.throws(() => definition.coerce({test: false}),
                {name: "TypeError", message: "Attribute 'test' expected value type 'string' but found type 'boolean'"},
                "Instance method 'coerce' did not reject boolean value 'false' for string attribute 'test'");
            assert.ok(stub.calledWithExactly(false, "both"),
                "Instance method 'coerce' did not directly call attribute instance method 'coerce'");
        });
        
        it("should expect coerce to be called on included schema extensions", () => {
            const stub = sinon.stub();
            const get = (t, p) => (p === "coerce" ? (...args) => (stub(...args) ?? t.coerce(...args)) : t[p]);
            const attributes = [new Attribute("string", "employeeNumber")];
            const extension = new SchemaDefinition("Extension", extensionId, "An Extension", attributes).truncate(["schemas", "meta"]);
            const definition = new SchemaDefinition(...Object.values(params)).extend(new Proxy(extension, {get}), true);
            const {[extension.id]: actual} = definition.coerce({[`${extension.id}:employeeNumber`]: "1234"});
            const expected = {employeeNumber: "1234"};
            
            assert.ok(stub.calledWithMatch({employeenumber: "1234"}),
                "Instance method 'coerce' did not call coerce method on included schema extensions");
            assert.deepStrictEqual({...actual}, expected,
                "Instance method 'coerce' did not correctly coerce included schema extension value");
        });
        
        it("should expect required schema extensions to be defined", () => {
            const definition = new SchemaDefinition(...Object.values(params))
                .extend(new SchemaDefinition("Extension", extensionId, "An Extension", []), true);
            
            assert.throws(() => definition.coerce({}),
                {name: "TypeError", message: `Missing values for required schema extension '${extensionId}'`},
                "Instance method 'coerce' did not attempt to coerce required schema extension");
            assert.throws(() => definition.coerce({[extensionId]: {}}),
                {name: "TypeError", message: `Missing values for required schema extension '${extensionId}'`},
                "Instance method 'coerce' did not attempt to coerce required schema extension");
        });
        
        it("should expect namespaced attributes or extensions to be coerced", () => {
            const attribute = new Attribute("string", "employeeNumber");
            const extension = new SchemaDefinition("Extension", extensionId, "An Extension", [attribute]);
            const definition = new SchemaDefinition(...Object.values(params)).truncate(["meta"]).extend(extension, true);
            const metadata = {schemas: [definition.id, extension.id]};
            const expected = {[extension.id]: {employeeNumber: "1234"}};
            
            assert.deepStrictEqual({...definition.coerce(expected)}, {...metadata, ...expected},
                "Instance method 'coerce' failed to coerce required schema extension value");
            assert.deepStrictEqual({...definition.coerce({[`${extensionId}:employeeNumber`]: "1234"})}, {...metadata, ...expected},
                "Instance method 'coerce' failed to coerce required schema extension value");
            assert.throws(() => definition.coerce({[`${extensionId}:employeeNumber`]: false}),
                {name: "TypeError", message: `Attribute 'employeeNumber' expected value type 'string' but found type 'boolean' in schema extension '${extension.id}'`},
                "Instance method 'coerce' did not attempt to coerce required schema extension's invalid value");
        });
        
        it("should expect deeply nested namespaced and extension attributes to be merged and coerced", () => {
            const attributes = [new Attribute("complex", "test", {}, [new Attribute("string", "name"), new Attribute("string", "value")])]
            const extension = new SchemaDefinition("Extension", extensionId, "An Extension", attributes);
            const definition = new SchemaDefinition(...Object.values(params)).extend(extension, true);
            const {[extension.id]: actual} = definition.coerce({[`${extension.id}:test.value`]: "Test", [extension.id]: {test: {name: "Test"}}});
            const expected = {test: {name: "Test", value: "Test"}};
            
            assert.deepStrictEqual({...actual}, expected,
                "Instance method 'coerce' did not expect deeply nested namespaced and extension attributes to be merged and coerced");
        });
        
        it("should expect the supplied filter to be applied to coerced result", () => {
            const attributes = [new Attribute("string", "testName"), new Attribute("string", "testValue")];
            const definition = new SchemaDefinition(...Object.values(params), "Test Schema", attributes);
            const result = definition.coerce({testName: "a string", testValue: "another string"}, undefined, undefined, new Filter("testName pr"));
            
            assert.ok(Object.keys(result).includes("testName"),
                "Instance method 'coerce' did not include attributes for filter 'testName pr'");
            assert.ok(!Object.keys(result).includes("testValue"),
                "Instance method 'coerce' included attributes not specified for filter 'testName pr'");
        });
        
        it("should expect positive filters to be preferred over negative filters", () => {
            const source = {testName: "a string", testValue: "another string", employeeNumber: "Test", costCenter: "Test"};
            const attributes = [new Attribute("string", "testName"), new Attribute("string", "testValue"), new Attribute("string", "employeeNumber"), new Attribute("string", "costCenter")];
            const definition = new SchemaDefinition(...Object.values(params), "Test Schema", attributes);
            const actual = definition.coerce(source, undefined, undefined, new Filter("employeeNumber np and testName np and testName pr"));
            const expected = {testName: "a string"};
            
            assert.deepStrictEqual({...actual}, expected,
                "Instance method 'coerce' did not prefer positive filters over negative filters");
        });
        
        it("should expect missing attributes in a filter to be ignored", () => {
            const attributes = [new Attribute("string", "employeeNumber"), new Attribute("string", "costCenter")];
            const definition = new SchemaDefinition(...Object.values(params), "Test Schema", attributes).truncate(["schemas", "meta"]);
            const expected = {employeeNumber: "Test", costCenter: "Test"};
            const actual = definition.coerce(expected, undefined, undefined, new Filter("userName np"));
            
            assert.deepStrictEqual({...actual}, expected,
                "Instance method 'coerce' did not ignore missing attributes specified in filter");
        });
        
        for (let [target, outcome, unexpected, expected, filter, multiValued] of [
            ["complex attributes", "filtered positively", "unexpectedly included", {test: {value: "False"}}, "test.value pr"],
            ["complex attributes", "filtered negatively", "unexpectedly excluded", {test: {name: "Test"}}, "test.value np"],
            ["complex multi-value attributes", "filtered positively", "unexpectedly included", {test: [{name: "Test"}]}, "test.name pr", true],
            ["complex multi-value attributes", "filtered negatively", "unexpectedly excluded", {test: [{value: "Test"}, {value: "False"}]}, "test.name np", true]
        ]) it(`should expect ${target} to be ${outcome}`, () => {
            const source = {test: multiValued ? [{name: "Test", value: "Test"}, {value: "False"}] : {name: "Test", value: "False"}};
            const attributes = [new Attribute("complex", "test", {multiValued}, [new Attribute("string", "name"), new Attribute("string", "value")])];
            const definition = new SchemaDefinition(...Object.values(params), "Test Schema", attributes).truncate(["schemas", "meta"]);
            
            assert.deepStrictEqual({...definition.coerce(source, undefined, undefined, new Filter(filter))}, expected,
                `Instance method 'coerce' ${unexpected} ${target} not specified for filter`);
        });
        
        for (let [target, outcome, unexpected, expected, filter] of [
            ["namespaced attributes", "included when not specified in negative filter", "unexpectedly excluded", {costCenter: "Test", [extensionId]: {employeeNumber: "1234", costCenter: "Test"}}, "employeeNumber np"],
            ["namespaced attributes", "excluded when not specified in positive filter", "unexpectedly included", {costCenter: "Test"}, "costCenter pr"],
            ["namespaced attributes", "filtered positively", "unexpectedly excluded", {[extensionId]: {employeeNumber: "1234"}}, `${extensionId}:employeeNumber pr`],
            ["namespaced attributes", "filtered negatively", "unexpectedly included", {employeeNumber: "Test", costCenter: "Test", [extensionId]: {costCenter: "Test"}}, `${extensionId}:employeeNumber np`],
            ["extension namespaces", "filtered positively", "unexpectedly included", {[extensionId]: {employeeNumber: "1234", costCenter: "Test"}}, `${extensionId} pr`],
            ["extension namespaces", "filtered negatively", "unexpectedly excluded", {employeeNumber: "Test", costCenter: "Test"}, `${extensionId} np`],
            ["direct and namespaced attributes", "filtered positively", "unexpectedly included", {costCenter: "Test", [extensionId]: {employeeNumber: "1234"}}, `costCenter pr and ${extensionId}:employeeNumber pr`],
            ["direct and namespaced attributes", "filtered negatively", "unexpectedly excluded", {employeeNumber: "Test", [extensionId]: {costCenter: "Test"}}, `costCenter np and ${extensionId}:employeeNumber np`]
        ]) it(`should expect ${target} to be ${outcome}`, () => {
            const source = {employeeNumber: "Test", costCenter: "Test", [`${extensionId}:employeeNumber`]: "1234", [`${extensionId}:costCenter`]: "Test"};
            const attributes = [new Attribute("string", "employeeNumber"), new Attribute("string", "costCenter")];
            const definition = new SchemaDefinition(...Object.values(params), "Test Schema", attributes).truncate(["schemas", "meta"])
                .extend(new SchemaDefinition("Extension", extensionId, "An Extension", attributes));
            
            assert.deepStrictEqual({...definition.coerce(source, undefined, undefined, new Filter(filter))}, expected,
                `Instance method 'coerce' ${unexpected} ${target} not specified for filter`);
        });
    });
});