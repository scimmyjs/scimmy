import assert from "assert";

export let SchemaSuite = async (SCIMMY) => {
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
}