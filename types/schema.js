import {Attribute} from "./attribute.js";

/**
 * SCIM Schema
 */
export class Schema {
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
     * Coerce a given value by making sure it conforms to all schema attributes' characteristics
     * @param {Object} data - value to coerce and confirm conformity of properties to schema attributes' characteristics
     * @param {String} [direction="both"] - whether to check for inbound, outbound, or bidirectional attributes
     * @returns {Object} the coerced value, conforming to all schema attributes' characteristics
     */
    coerce(data, direction = "both") {
        let target = {},
            // Add schema's name as resource type to meta attribute
            source = {...data, meta: {...(data?.meta ?? {}), resourceType: this.name}};
        
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