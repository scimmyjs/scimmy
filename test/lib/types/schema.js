import assert from "assert";
import {Schema} from "#@/lib/types/schema.js";
import {SchemaDefinition} from "#@/lib/types/definition.js";

/**
 * Create a class that extends SCIMMY.Types.Schema, for use in tests
 * @param {Object} [params] - parameters to pass through to the SchemaDefinition instance
 * @param {String} [params.name] - the name to pass through to the SchemaDefinition instance
 * @param {String} [params.id] - the ID to pass through to the SchemaDefinition instance
 * @param {String} [params.description] - the description to pass through to the SchemaDefinition instance
 * @param {String} [params.attributes] - the attributes to pass through to the SchemaDefinition instance
 * @returns {typeof Schema} a class that extends SCIMMY.Types.Schema for use in tests
 */
export const createSchemaClass = ({name = "Test", id = "urn:ietf:params:scim:schemas:Test", description = "A Test", attributes} = {}) => (
    class Test extends Schema {
        static #definition = new SchemaDefinition(name, id, description, attributes);
        static get definition() { return Test.#definition; }
        constructor(resource, direction = "both", basepath, filters) {
            super(resource, direction);
            Object.assign(this, Test.#definition.coerce(resource, direction, basepath, filters));
        }
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