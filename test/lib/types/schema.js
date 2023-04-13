import assert from "assert";
import {Schema} from "#@/lib/types/schema.js";
import {SchemaDefinition} from "#@/lib/types/definition.js";

/**
 * Create a class that extends SCIMMY.Types.Schema, for use in tests
 * @param {*[]} params - arguments to pass through to the SchemaDefinition instance
 * @returns {typeof Schema} a class that extends SCIMMY.Types.Schema for use in tests
 */
export const createSchemaClass = (...params) => (
    class Test extends Schema {
        static #definition = new SchemaDefinition(...params);
        static get definition() { return Test.#definition; }
    }
);

describe("SCIMMY.Types.Schema", () => {
    it("should have abstract static member 'definition'", () => {
        assert.ok(typeof Object.getOwnPropertyDescriptor(Schema, "definition").get === "function",
            "Abstract static member 'definition' not defined");
        assert.throws(() => Schema.definition,
            {name: "TypeError", message: "Method 'get' for property 'definition' must be implemented by subclass"},
            "Static member 'definition' not abstract");
    });
    
    describe(".extend()", () => {
        it("should have static method 'extend'", () => {
            assert.ok(typeof Schema.extend === "function",
                "Static method 'extend' not defined");
        });
    });
    
    describe(".truncate()", () => {
        it("should have static method 'truncate'", () => {
            assert.ok(typeof Schema.truncate === "function",
                "Static method 'truncate' not defined");
        });
    });
});