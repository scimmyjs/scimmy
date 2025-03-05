import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import SchemasHooks, {createSchemaClass} from "../../hooks/schemas.js";
import {Attribute} from "#@/lib/types/attribute.js";
import {Schema} from "#@/lib/types/schema.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./schema.json"), "utf8").then((f) => JSON.parse(f));

describe("SCIMMY.Types.Schema", () => {
    describe(".id", () => {
        it("should be defined", () => {
            assert.ok(typeof Object.getOwnPropertyDescriptor(Schema, "id").get === "function",
                "Static member 'id' was not defined");
        });
        
        it("should be abstract", () => {
            assert.throws(() => Schema.id,
                {name: "TypeError", message: "Method 'get' for static property 'id' must be implemented by subclass"},
                "Static member 'id' was not abstract");
        });
    });
    
    describe(".definition", () => {
        it("should be defined", () => {
            assert.ok(typeof Object.getOwnPropertyDescriptor(Schema, "definition").get === "function",
                "Static member 'definition' was not defined");
        });
        
        it("should be abstract", () => {
            assert.throws(() => Schema.definition,
                {name: "TypeError", message: "Method 'get' for static property 'definition' must be implemented by subclass"},
                "Static member 'definition' was not abstract");
        });
    });
    
    describe(".extend()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Schema.extend === "function",
                "Static method 'extend' was not implemented");
        });
        
        it("should expect 'extension' argument to be a Schema class, SchemaDefinition instance, or collection of Attribute instances", () => {
            assert.throws(() => Schema.extend({}), 
                {name: "TypeError", message: "Expected 'extension' to be a Schema class, SchemaDefinition instance, or collection of Attribute instances"},
                "Static method 'extend' did not throw with invalid object input");
            assert.throws(() => Schema.extend([new Attribute("string", "test"), {}]),
                {name: "TypeError", message: "Expected 'extension' to be a Schema class, SchemaDefinition instance, or collection of Attribute instances"},
                "Static method 'extend' did not throw with invalid object input");
        });
    });
    
    describe(".truncate()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Schema.truncate === "function",
                "Static method 'truncate' was not implemented");
        });
        
        it("should resolve schema definition instances from Schema classes", () => {
            const attributes = [new Attribute("string", "aValue"), new Attribute("string", "aString", {returned: false})];
            const Test = createSchemaClass({attributes});
            const Extension = createSchemaClass({name: "Extension", id: Test.definition.id.replace("Test", "Extension")});
            
            Test.extend(Extension);
            
            try {
                Test.truncate(Extension);
            } catch (ex) {
                assert.fail(`Static method 'truncate' did not resolve schema definition instance from Schema class\r\n[cause]: ${ex}`);
            }
        });
    });
    
    describe("@constructor", () => {
        new SchemasHooks(createSchemaClass({attributes: [new Attribute("string", "aString")]}), fixtures).construct().call();
        
        it("should include 'toJSON' method that strips attributes where returned is marked as 'never'", async () => {
            const attributes = [new Attribute("string", "aValue"), new Attribute("string", "aString", {returned: false})];
            const Test = createSchemaClass({attributes});
            const source = {aValue: "a value"};
            const actual = new Test({...source, aString: "a string"});
            const expected = {schemas: [Test.definition.id], meta: {resourceType: Test.definition.name}, ...source};
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Schema instance did not include 'toJSON' method that strips attributes where returned is marked as 'never'");
        });
        
        it("should include 'toJSON' method on schema extension values", () => {
            const Test = createSchemaClass();
            const attributes = [new Attribute("string", "aValue"), new Attribute("string", "aString", {returned: false})];
            const Extension = createSchemaClass({name: "Extension", id: Test.definition.id.replace("Test", "Extension"), attributes});
            const source = {aValue: "a value"};
            const expected = {schemas: [Test.definition.id, Extension.definition.id], meta: {resourceType: Test.definition.name}, [Extension.definition.id]: source};
            
            Test.extend(Extension);
            
            const actual = new Test({[Extension.definition.id]: {...source, aString: "a string"}});
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected,
                "Schema instance did not include 'toJSON' method on schema extension values");
        });
    });
});