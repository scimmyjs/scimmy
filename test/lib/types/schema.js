import assert from "assert";
import {Schema} from "#@/lib/types/schema.js";

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
});