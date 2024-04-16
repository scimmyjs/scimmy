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
    describe(".definition", () => {
        it("should be defined", () => {
            assert.ok(typeof Object.getOwnPropertyDescriptor(Schema, "definition").get === "function",
                "Static member 'definition' was not defined");
        });
        
        it("should be abstract", () => {
            assert.throws(() => Schema.definition,
                {name: "TypeError", message: "Method 'get' for property 'definition' must be implemented by subclass"},
                "Static member 'definition' was not abstract");
        });
    });
    
    describe(".extend()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Schema.extend === "function",
                "Static method 'extend' was not implemented");
        });
    });
    
    describe(".truncate()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Schema.truncate === "function",
                "Static method 'truncate' was not implemented");
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
    });
});