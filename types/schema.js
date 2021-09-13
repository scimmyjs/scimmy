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
    static get definition() {
        throw new TypeError("Method 'get' for property 'schema' must be implemented by subclass");
    }
    
    /**
     * Stores a schema's definition instance
     * @type {SchemaDefinition}
     * @abstract
     */
    static #definition;
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
            new Attribute("string", "id", {direction: "out", returned: "always", required: true, mutable: false, caseExact: true, uniqueness: "global"}),
            new Attribute("string", "externalId", {direction: "in", caseExact: true}),
            new Attribute("complex", "meta", {required: true, mutable: false}, [
                new Attribute("string", "resourceType", {required: true, mutable: false, caseExact: true}),
                new Attribute("dateTime", "created", {direction: "out", mutable: false}),
                new Attribute("dateTime", "lastModified", {direction: "out", mutable: false}),
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
    describe(basepath = "") {
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
     * @param {Filter} [filters] - the attribute filters to apply to the coerced value
     * @returns {Object} the coerced value, conforming to all schema attributes' characteristics
     */
    coerce(data, direction = "both", basepath, filters) {
        // Make sure there is data to coerce...
        if (data === undefined) throw new Error("No data to coerce");
        
        let filter = (filters ?? []).slice(0).shift(),
            target = {},
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
                value = attribute.coerce(source[name] ?? source[`${name[0].toUpperCase()}${name.slice(1)}`], direction);
            
            // If it's defined, add it to the target
            if (value !== undefined) target[name] = value;
        }
        
        return this.#filter(target, filter);
    }
    
    /**
     * Filter out desired or undesired attributes from a coerced schema value
     * @param {Object|Object[]} [data] - the data to filter attributes from
     * @param {Object} [filter] - the filter to apply to the coerced value
     * @param {Attribute[]} [attributes] - set of attributes to match against
     * @returns {Object} the coerced value with desired or undesired attributes filtered out
     */
    #filter(data = {}, filter, attributes = this.attributes) {
        // If there's no filter, just return the data
        if (filter === undefined) return data;
        // If the data is a set, only get values that match the filter
        else if (Array.isArray(data)) {
            return data.filter(value => (Array.isArray(filter) ? filter : [filter])
                // Match against any of the filters in the set
                .some(f => Object.entries(f).every(([attr, [comparator, expected]]) => {
                    // Cast true and false strings to boolean values
                    expected = (expected === "false" ? false : (expected === "true" ? true : expected));
                    
                    switch (comparator) {
                        case "pr":
                            return attr in value;
                            
                        case "eq":
                            return value[attr] === expected;
                            
                        case "ne":
                            return value[attr] !== expected;
                    }
                })));
            
        // Otherwise, filter the data!
        } else {
            // Check for any negative filters
            for (let key in {...filter}) {
                let {config: {returned} = {}} = attributes.find(a => a.name === key) ?? {};
                
                if (returned !== "always" && Array.isArray(filter[key]) && filter[key][0] === "np") {
                    // Remove the property from the result, and remove the spent filter
                    delete data[key];
                    delete filter[key];
                }
            }
            
            // Check to see if there's any filters left
            if (!Object.keys(filter).length) return data;
            else {
                // Prepare resultant value storage
                let target = {}
                
                // Go through every value in the data and filter attributes
                for (let key in data) {
                    // Get the matching attribute definition and some relevant config values
                    let attribute = attributes.find(a => a.name === key) ?? {},
                        {type, config: {returned, multiValued} = {}, subAttributes} = attribute;
                    
                    // If the attribute is always returned, add it to the result
                    if (returned === "always") target[key] = data[key];
                    // Otherwise, if the attribute ~can~ be returned, process it
                    else if (returned === true) {
                        // If the filter is simply based on presence, assign the result
                        if (Array.isArray(filter[key]) && filter[key][0] === "pr")
                            target[key] = data[key];
                        // Otherwise if the filter is defined and the attribute is complex, evaluate it
                        else if (key in filter && type === "complex")
                            target[key] = this.#filter(data[key], filter[key], multiValued ? [] : subAttributes);
                    }
                }
                
                return target;
            }
        }
    }
}