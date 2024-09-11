import assert from "assert";
import SCIMMY from "#@/scimmy.js";

/**
 * Test whether the returned value of a method call was made immutable
 * @param {String} name - the name of the method that produced the object
 * @param {Object} config - the returned value of the called method
 */
function returnsImmutableObject(name, config) {
    assert.ok(Object(config) === config && !Array.isArray(config),
        `Static method '${name}' did not return an object`);
    assert.throws(() => (config.test = true),
        {name: "TypeError", message: "SCIM Configuration can only be changed via the 'set' method"},
        `Static method '${name}' returned a mutable object`);
}

describe("SCIMMY.Config", () => {
    // Reset the configuration after all config tests are complete
    after(() => SCIMMY.Config.set({
        documentationUri: false, authenticationSchemes: [], changePassword: false,
        etag: false, patch: false, sort: false, filter: {maxResults: 200, supported: false},
        bulk: {maxOperations: 1000, maxPayloadSize: 1048576, supported: false}
    }));
    
    describe(".get()", () => {
        it("should be implemented", () => {
            assert.ok(typeof SCIMMY.Config.get === "function",
                "Static method 'get' was not implemented");
        });
        
        it("should return an immutable object", () => (
            returnsImmutableObject("get", SCIMMY.Config.get())
        ));
    });
    
    describe(".set()", () => {
        it("should be implemented", () => {
            assert.ok(typeof SCIMMY.Config.set === "function",
                "Static method 'set' was not implemented");
        });
        
        it("should return an immutable object", () => (
            returnsImmutableObject("set", SCIMMY.Config.set())
        ));
        
        it("should do nothing without arguments", () => {
            const config = SCIMMY.Config.get();
            
            assert.deepStrictEqual(SCIMMY.Config.set(), config,
                "Static method 'set' unexpectedly modified config");
        });
        
        it("should not accept unknown attributes", () => {
            assert.throws(() => SCIMMY.Config.set("test", true),
                {name: "TypeError", message: "SCIM configuration: schema does not define attribute 'test'"},
                "Static method 'set' accepted unknown attribute name string");
            assert.throws(() => SCIMMY.Config.set({test: true}),
                {name: "TypeError", message: "SCIM configuration: schema does not define attribute 'test'"},
                "Static method 'set' accepted unknown attribute object key");
            assert.throws(() => SCIMMY.Config.set("patch", {test: true}),
                {name: "TypeError", message: "SCIM configuration: attribute 'patch' of schema 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig' does not declare subAttribute 'test'"},
                "Static method 'set' accepted unknown sub-attribute object key");
        });
        
        it("should not accept boolean value 'true' for 'documentationUri' attribute", () => {    
            assert.throws(() => SCIMMY.Config.set("documentationUri", true),
                {name: "TypeError", message: "SCIM configuration: attribute 'documentationUri' expected value type 'string'"},
                "Static method 'set' accepted boolean value 'true' for 'documentationUri' attribute");
        });
        
        it("should not accept string value 'true' for 'documentationUri' attribute", () => {
            assert.throws(() => SCIMMY.Config.set("documentationUri", "true"),
                {name: "TypeError", message: "Attribute 'documentationUri' expected value type 'reference' to refer to one of: 'external'"},
                "Static method 'set' accepted string value 'true' for 'documentationUri' attribute");
        });
        
        it("should accept string value 'https://example.com' for 'documentationUri' attribute", () => {
            assert.doesNotThrow(() => SCIMMY.Config.set("documentationUri", "https://example.com"),
                "Static method 'set' did not accept string value 'https://example.com' for 'documentationUri' attribute");
        });
        
        it("should accept boolean value 'false' for 'documentationUri' attribute", () => {
            assert.doesNotThrow(() => SCIMMY.Config.set("documentationUri", false),
                "Static method 'set' did not accept boolean value 'false' for 'documentationUri' attribute");
        });
        
        it("should not accept boolean value 'true' for 'authenticationSchemes' attribute", () => {
            assert.throws(() => SCIMMY.Config.set("authenticationSchemes", true),
                {name: "TypeError", message: "Complex attribute 'authenticationSchemes' expected complex value but found type 'boolean'"},
                "Static method 'set' accepted boolean value 'true' for 'authenticationSchemes' attribute");
        });
        
        for (let attrib of ["patch", "bulk", "filter", "changePassword", "sort", "etag"]) {
            it(`should accept shorthand boolean values 'true' and 'false' for '${attrib}' attribute`, () => {
                for (let value of [true, false]) {
                    SCIMMY.Config.set(attrib, value);
                    assert.strictEqual(SCIMMY.Config.get()[attrib].supported, value,
                        `Static method 'set' did not accept boolean value '${value}' for '${attrib}' attribute`);
                }
            });
            
            it(`should accept complex value 'supported' for '${attrib}' attribute`, () => {
                SCIMMY.Config.set(attrib, {supported: true});
                assert.strictEqual(SCIMMY.Config.get()[attrib].supported, true,
                    `Static method 'set' did not accept complex value 'supported' for '${attrib}' attribute`);
            });
            
            it(`should not accept shorthand string value for '${attrib}' attribute`, () => {
                assert.throws(() => SCIMMY.Config.set(attrib, "test"),
                    {name: "TypeError", message: `SCIM configuration: attribute '${attrib}' expected value type 'complex' but got 'string'`},
                    `Static method 'set' accepted shorthand string value for '${attrib}' attribute`);
            });
        }
        
        for (let attrib of ["bulk", "filter"]) {
            it(`should accept shorthand positive integer value for '${attrib}' attribute`, () => {
                SCIMMY.Config.set(attrib, 100);
                assert.strictEqual(SCIMMY.Config.get()[attrib][attrib === "filter" ? "maxResults" : "maxOperations"], 100,
                    `Static method 'set' did not accept shorthand positive integer value for '${attrib}' attribute`);
            });
            
            it(`should not accept shorthand negative integer value for '${attrib}' attribute`, () => {
                assert.throws(() => SCIMMY.Config.set(attrib, -1),
                    {name: "TypeError", message: `SCIM configuration: property '${attrib}' expects number value to be zero or more`},
                    `Static method 'set' accepted shorthand negative integer value for '${attrib}' attribute`);
            });
        }
        
        for (let attrib of ["patch", "changePassword", "sort", "etag"]) {
            it(`should not accept shorthand integer value for '${attrib}' attribute`, () => {
                assert.throws(() => SCIMMY.Config.set(attrib, 1),
                    {name: "TypeError", message: `SCIM configuration: property '${attrib}' does not define any number-based attributes`},
                    `Static method 'set' accepted shorthand integer value for '${attrib}' attribute`);
            });
        }
    });
});