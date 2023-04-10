import assert from "assert";
import SCIMMY from "#@/scimmy.js";

/**
 * Create a class that extends SCIMMY.Types.Schema, for use in tests
 * @param {*[]} params - arguments to pass through to the SchemaDefinition instance
 * @returns {typeof SCIMMY.Types.Schema} a class that extends SCIMMY.Types.Schema for use in tests
 */
export const createSchemaClass = (...params) => (
    class Test extends SCIMMY.Types.Schema {
        static #definition = new SCIMMY.Types.SchemaDefinition(...params);
        static get definition() { return Test.#definition; }
    }
);

export const SchemaSuite = () => {
    it("should include static class 'Schema'", () => 
        assert.ok(!!SCIMMY.Types.Schema, "Static class 'Schema' not defined"));
    
    describe("SCIMMY.Types.Schema", () => {
        it("should have abstract static member 'definition'", () => {
            assert.ok(typeof Object.getOwnPropertyDescriptor(SCIMMY.Types.Schema, "definition").get === "function",
                "Abstract static member 'definition' not defined");
            assert.throws(() => SCIMMY.Types.Schema.definition,
                {name: "TypeError", message: "Method 'get' for property 'definition' must be implemented by subclass"},
                "Static member 'definition' not abstract");
        });
        
        describe(".extend()", () => {
            it("should have static method 'extend'", () => {
                assert.ok(typeof SCIMMY.Types.Schema.extend === "function",
                    "Static method 'extend' not defined");
            });
        });
        
        describe(".truncate()", () => {
            it("should have static method 'truncate'", () => {
                assert.ok(typeof SCIMMY.Types.Schema.truncate === "function",
                    "Static method 'truncate' not defined");
            });
        });
    });
};