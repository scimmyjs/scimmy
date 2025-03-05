import assert, {AssertionError} from "assert";
import {Attribute} from "#@/lib/types/attribute.js";
import {SchemaDefinition} from "#@/lib/types/definition.js";
import {Schema} from "#@/lib/types/schema.js";

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

export default class ResourcesHooks {
    #target;
    #fixtures;
    
    constructor(TargetResource, fixtures) {
        this.#target = TargetResource;
        this.#fixtures = fixtures;
    }
    
    construct = () => (() => {
        const TargetSchema = this.#target;
        const fixtures = this.#fixtures;
        
        it("should require 'resource' parameter to be an object at instantiation", () => {
            assert.throws(() => new TargetSchema(),
                {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                "Schema instance did not expect 'resource' parameter to be defined");
            assert.throws(() => new TargetSchema("a string"),
                {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                "Schema instantiation did not fail with 'resource' parameter string value 'a string'");
            assert.throws(() => new TargetSchema([]),
                {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                "Schema instantiation did not fail with 'resource' parameter array value");
        });
        
        it("should validate 'schemas' property of 'resource' parameter if it is defined", () => {
            try {
                // Add an empty required extension
                TargetSchema.extend(new SchemaDefinition("Extension", "urn:ietf:params:scim:schemas:Extension"), true);
                
                assert.throws(() => new TargetSchema({schemas: ["a string"]}),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "The request body supplied a schema type that is incompatible with this resource"},
                    "Schema instance did not validate 'schemas' property of 'resource' parameter");
                assert.throws(() => new TargetSchema({schemas: [TargetSchema.definition.id]}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "The request body is missing schema extension 'urn:ietf:params:scim:schemas:Extension' required by this resource type"},
                    "Schema instance did not validate required extensions in 'schemas' property of 'resource' parameter");
            } finally {
                // Remove the extension so it doesn't interfere later
                TargetSchema.truncate("urn:ietf:params:scim:schemas:Extension");
            }
        });
        
        it("should define getters and setters for all attributes in the schema definition", async () => {
            const {definition, constructor = {}} = await fixtures;
            const attributes = definition.attributes.map(a => a.name);
            const instance = new TargetSchema(constructor);
            
            for (let attrib of attributes) {
                assert.ok(attrib in instance,
                    `Schema instance did not define member '${attrib}'`);
                assert.ok(typeof Object.getOwnPropertyDescriptor(instance, attrib).get === "function",
                    `Schema instance member '${attrib}' was not defined with a 'get' method`);
                assert.ok(typeof Object.getOwnPropertyDescriptor(instance, attrib).set === "function",
                    `Schema instance member '${attrib}' was not defined with a 'set' method`);
            }
        });
        
        it("should include lower-case attribute name property accessor aliases", async () => {
            const {constructor = {}} = await fixtures;
            const instance = new TargetSchema(constructor);
            const [key, value] = Object.entries(constructor).shift();
            
            try {
                instance[key.toLowerCase()] = value.toUpperCase();
            } catch (ex) {
                if (ex.scimType !== "mutability") throw ex;
            }
            
            assert.strictEqual(instance[key.toLowerCase()], instance[key],
                "Schema instance did not include lower-case attribute aliases");
        });
        
        it("should include extension schema attribute property accessor aliases", async () => {
            const attributes = [new Attribute("string", "testValue"), new Attribute("complex", "complexValue", {}, [new Attribute("string", "subValue")])];
            const extension = new SchemaDefinition("Extension", "urn:ietf:params:scim:schemas:Extension", "", attributes);
            const {constructor = {}} = await fixtures;
            
            try {
                // Add the extension, including complex attributes
                TargetSchema.extend(extension);
                
                // Construct an instance to test against
                const instance = new TargetSchema(constructor);
                
                // Make sure instance includes namespaced extension attribute accessors...
                instance[`${extension.id}:testValue`] = "a string";
                assert.strictEqual(instance[`${extension.id}:testValue`], "a string",
                    "Schema instance did not include schema extension attribute aliases");
                // ...as well as lower-case aliases
                instance[`${extension.id}:testValue`.toLowerCase()] = "another string";
                assert.strictEqual(instance[`${extension.id}:testValue`.toLowerCase()], "another string",
                    "Schema instance did not include lower-case schema extension attribute aliases");
                // Make sure instance includes accessors for nested complex attributes in the extension...
                instance[`${extension.id}:complexValue.subValue`] = "a string";
                assert.strictEqual(instance[`${extension.id}:complexValue.subValue`], "a string",
                    "Schema instance did not include schema extension complex attribute aliases");
                // ...as well as lower-case aliases for these too
                instance[`${extension.id}:complexValue.subValue`.toLowerCase()] = "another string";
                assert.strictEqual(instance[`${extension.id}:complexValue.subValue`.toLowerCase()], "another string",
                    "Schema instance did not include lower-case schema extension complex attribute aliases");
                // Make sure instance includes a lower-case alias for the extension ID accessors
                instance[extension.id.toLowerCase()] = {testValue: "a string"};
                assert.strictEqual(instance[extension.id.toLowerCase()].testValue, "a string",
                    "Schema instance did not include schema extension alias");
            } catch (ex) {
                if (ex instanceof AssertionError) throw ex;
                assert.fail(`Schema instance did not include extension schema attribute property accessor aliases\r\n[cause]: ${ex}`);
            } finally {
                // Remove the extension so it doesn't interfere later
                TargetSchema.truncate("urn:ietf:params:scim:schemas:Extension");
            }
        });
        
        // https://github.com/scimmyjs/scimmy/issues/12
        it("should coerce complex multi-value attributes in schema extensions", async () => {
            const {constructor = {}} = await fixtures;
            const subAttribute = new Attribute("string", "name");
            const attribute = new Attribute("complex", "agencies", {multiValued: true}, [subAttribute]);
            const extension = new SchemaDefinition("Extension", "urn:ietf:params:scim:schemas:Extension", "", [attribute]);
            const source = {...constructor, [extension.id]: {[attribute.name]: [{[subAttribute.name]: "value"}]}};
            
            try {
                // Add the extension to the target
                TargetSchema.extend(extension);
                
                // Construct an instance to test against, and get actual value for comparison
                const instance = new TargetSchema(source);
                const actual = JSON.parse(JSON.stringify(instance[extension.id][attribute.name]));
                
                assert.deepStrictEqual(actual, source[extension.id][attribute.name],
                    "Schema instance did not coerce complex multi-value attributes from schema extension");
            } finally {
                // Remove the extension so it doesn't interfere later
                TargetSchema.truncate("urn:ietf:params:scim:schemas:Extension");
            }
        });
        
        it("should expect errors in extension schema coercion to be rethrown as SCIMErrors", async () => {
            const {constructor = {}} = await fixtures;
            const attributes = [new Attribute("string", "testValue")];
            const extension = new SchemaDefinition("Extension", "urn:ietf:params:scim:schemas:Extension", "", attributes);
            const source = {...constructor, [`${extension.id}:testValue`]: "a string"};
            
            try {
                // Add the extension to the target
                TargetSchema.extend(extension);
    
                // Construct an instance to test against
                const instance = new TargetSchema(source);
    
                assert.throws(() => instance[extension.id].test = true,
                    {name: "TypeError", message: "Cannot add property test, object is not extensible"},
                    "Schema was extensible after instantiation");
                assert.throws(() => instance[extension.id] = {test: true},
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "Cannot add property test, object is not extensible"},
                    "Schema was extensible after instantiation");
            } finally {
                // Remove the extension so it doesn't interfere later
                TargetSchema.truncate("urn:ietf:params:scim:schemas:Extension");
            }
        });
        
        it("should clean up empty extension schema properties", async () => {
            // Get attributes for the extension ready
            const attributes = [
                new Attribute("string", "deletedValue"),
                new Attribute("complex", "testValue", {}, [
                    new Attribute("string", "stringValue"),
                    new Attribute("complex", "value", {}, [
                        new Attribute("string", "value")
                    ])
                ])
            ];
            
            // Get the extension and the source data ready
            const {constructor = {}} = await fixtures;
            const extension = new SchemaDefinition("Extension", "urn:ietf:params:scim:schemas:Extension", "", attributes);
            const source = {
                ...constructor,
                [`${extension.id}:deletedValue`]: "a string",
                [`${extension.id}:testValue.stringValue`]: "a string",
                [`${extension.id}:testValue.value.value`]: "a string"
            };
            
            try {
                // Add the extension to the target
                TargetSchema.extend(extension);
                
                // Construct an instance to test against
                const instance = new TargetSchema(source);
                
                // Unset the extension values and check for cleanup
                instance[`${extension.id}:deletedValue`] = undefined;
                assert.strictEqual(instance[extension.id].deletedValue, undefined,
                    "Schema instance did not clean up empty extension schema attribute properties");
                instance[`${extension.id}:testValue.stringValue`] = undefined;
                assert.strictEqual(instance[extension.id].testValue.stringValue, undefined,
                    "Schema instance did not clean up empty extension schema sub-attribute properties");
                instance[`${extension.id}:testValue.value.value`] = undefined;
                assert.strictEqual(instance[extension.id], undefined,
                    "Schema instance did not clean up empty extension schema properties");
            } finally {
                // Remove the extension so it doesn't interfere later
                TargetSchema.truncate("urn:ietf:params:scim:schemas:Extension");
            }
        });
        
        it("should be frozen after instantiation", async () => {
            const {constructor = {}} = await fixtures;
            const instance = new TargetSchema(constructor);
            
            assert.throws(() => instance.test = true,
                {name: "TypeError", message: "Cannot add property test, object is not extensible"},
                "Schema was extensible after instantiation");
            assert.throws(() => delete instance.meta,
                {name: "TypeError", message: `Cannot delete property 'meta' of #<${instance.constructor.name}>`},
                "Schema was not sealed after instantiation");
        });
    });
    
    id = () => (() => {
        const TargetSchema = this.#target;
        
        it("should be defined", () => {
            assert.ok("id" in TargetSchema,
                "Static member 'id' not defined");
        });
        
        it("should be a string", () => {
            assert.ok(typeof TargetSchema.id === "string",
                "Static member 'id' was not a string");
        });
        
        it("should match ID from definition instance", async () => {
            assert.strictEqual(TargetSchema.id, TargetSchema.definition.id,
                "Static member 'id' did not match 'id' from definition instance");
        });
    });
    
    definition = () => (() => {
        const TargetSchema = this.#target;
        const fixtures = this.#fixtures;
        
        it("should be defined", () => {
            assert.ok("definition" in TargetSchema,
                "Static member 'definition' not defined");
        });
        
        it("should be an instance of SchemaDefinition", () => {
            assert.ok(TargetSchema.definition instanceof SchemaDefinition,
                "Static member 'definition' was not an instance of SchemaDefinition");
        });
        
        it("should produce definition object that matches sample schemas defined in RFC7643", async () => {
            const {definition} = await fixtures;
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(TargetSchema.definition.describe("/Schemas"))), definition,
                "Definition did not match sample schema defined in RFC7643");
        });
    });
};