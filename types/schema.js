import {Attribute} from "./attribute.js";

/**
 * SCIM Schema
 * @interface
 */
export class Schema {
    /**
     * Retrieves a schema's definition instance
     * @returns {SchemaDefinition}
     * @abstract
     */
    static get schema() {
        throw new TypeError("Method 'get' for property 'schema' must be implemented by subclass");
    }
    
    /**
     * Stores a schema's definition instance
     * @type {SchemaDefinition}
     * @abstract
     */
    static #schema;
}

/**
 * SCIM Schema Definition
 */
export class SchemaDefinition {
    /**
     * Constructs an instance of a full SCIM schema definition
     * @param {String} name - friendly name of the SCIM schema
     * @param {String} id - URN namespace of the SCIM schema
     * @param {String} [description=""] - a human-readable description of the schema
     * @param {Attribute[]} [attributes=[]] - attributes that make up the schema
     */
    constructor(name = "", id = "", description = "", attributes = []) {
        // Store the schema name, ID, and description
        this.name = name;
        this.id = id;
        this.description = description;
        
        // Add common attributes used by all schemas, then add the schema-specific attributes
        this.attributes = [
            new Attribute("string", "id", {required: true, direction: "out", mutable: false, caseExact: true, uniqueness: "global"}),
            new Attribute("string", "externalId", {direction: "in", caseExact: true}),
            new Attribute("complex", "meta", {required: true, mutable: false}, [
                new Attribute("string", "resourceType", {required: true, mutable: false, caseExact: true}),
                new Attribute("dateTime", "created", {required: true, direction: "out", mutable: false}),
                new Attribute("dateTime", "lastModified", {required: true, direction: "out", mutable: false}),
                new Attribute("string", "location", {direction: "out", mutable: false}),
                new Attribute("string", "version", {direction: "out", mutable: false})
            ]),
            // Only include valid Attribute instances
            ...attributes.filter(attr => attr instanceof Attribute)
        ];
    }
    
    /**
     * Get the SCIM schema definition for consumption by clients
     * @param {String} [basepath=""] - the base path for the schema's meta.location property
     * @returns {Object} the schema definition for consumption by clients
     */
    definition(basepath = "") {
        return {
            schemas: ["urn:ietf:params:scim:schemas:core:2.0:Schema"],
            ...this,
            attributes: this.attributes.slice(3),
            meta: {resourceType: "Schema", location: `${basepath}/${this.id}`}
        };
    }
    
    /**
     * Coerce a given value by making sure it conforms to all schema attributes' characteristics
     * @param {Object} data - value to coerce and confirm conformity of properties to schema attributes' characteristics
     * @param {String} [direction="both"] - whether to check for inbound, outbound, or bidirectional attributes
     * @param {String} [basepath] - the URI representing the resource type's location
     * @returns {Object} the coerced value, conforming to all schema attributes' characteristics
     */
    coerce(data, direction = "both", basepath) {
        // Make sure there is data to coerce...
        if (data === undefined) throw new Error("No data to coerce");
        
        let target = {},
            // Add schema's name as resource type to meta attribute
            source = {...data, meta: {
                ...(data?.meta ?? {}),
                resourceType: this.name,
                ...(typeof basepath === "string" ? {location: `${basepath}/${data.id}`} : {})
            }};
        
        // Go through all attributes and coerce them
        for (let attribute of this.attributes) {
            let {name} = attribute,
                // Evaluate the coerced value
                value = attribute.coerce(source[name] ?? source[`${name[0]}${name.slice(1)}`], direction);
            
            // If it's defined, add it to the target
            if (value !== undefined) target[name] = value;
        }
        
        return target;
    }
}