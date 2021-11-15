import {SchemaDefinition} from "./definition.js";
import {Attribute} from "./attribute.js";
import {SCIMError} from "./error.js";

/**
 * SCIM Schema
 * @alias SCIMMY.Types.Schema
 * @summary
 * *   Extendable class which provides the ability to construct resource instances with automated validation of conformity to a resource's schema definition.
 * *   Once instantiated, any modifications will also be validated against the attached schema definition's matching attribute configuration (e.g. for mutability or canonical values).
 */
export class Schema {
    /**
     * Retrieves a schema's definition instance
     * @type {SCIMMY.Types.SchemaDefinition}
     * @abstract
     */
    static get definition() {
        throw new TypeError("Method 'get' for property 'definition' must be implemented by subclass");
    }
    
    /**
     * Stores a schema's definition instance
     * @type {SCIMMY.Types.SchemaDefinition}
     * @private
     * @abstract
     */
    static #definition;
    
    /**
     * Extend a schema by mixing in other schemas or attributes
     * @param {SCIMMY.Types.Schema|Array<SCIMMY.Types.Attribute>} extension - the schema extensions or collection of attributes to register
     * @param {Boolean} [required=false] - if the extension is a schema, whether or not the extension is required
     */
    static extend(extension, required = false) {
        this.definition.extend((extension.prototype instanceof Schema ? extension.definition : extension), required);
    }
    
    /**
     * Remove an attribute or subAttribute from the schema definition
     * @param {String|SCIMMY.Types.Attribute|Array<String|SCIMMY.Types.Attribute>} attributes - the child attributes to remove from the schema definition
     */
    static truncate(attributes) {
        this.definition.truncate(attributes);
    }
    
    /**
     * Construct a resource instance after verifying schema compatibility
     * @param {Object} data - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     */
    constructor(data = {}, direction) {
        let {schemas = []} = data,
            // Create internally scoped storage object
            resource = {},
            // Source attributes and extensions from schema definition
            {definition} = this.constructor,
            attributes = definition.attributes.filter(a => a instanceof Attribute),
            extensions = definition.attributes.filter(a => a instanceof SchemaDefinition);
        
        // If schemas attribute is specified, make sure all required schema IDs are present
        if (Array.isArray(schemas) && schemas.length) {
            // Check for this schema definition's ID
            if (!schemas.includes(definition.id))
                throw new SCIMError(400, "invalidSyntax", "The request body supplied a schema type that is incompatible with this resource");
            
            // Check for required schema extension IDs
            for (let extension of extensions) {
                if (extension.required && !schemas.includes(extension.id)) {
                    throw new SCIMError(400, "invalidValue", `The request body is missing schema extension '${extension.id}' required by this resource type`);
                }
            }
        }
        
        // Predefine getters and setters for all possible attributes
        for (let attribute of attributes) Object.defineProperties(this, {
            // Because why bother with case-sensitivity in a JSON-based standard?
            // See: RFC7643§2.1 (https://datatracker.ietf.org/doc/html/rfc7643#section-2.1)
            [attribute.name.toLowerCase()]: {
                get: () => (this[attribute.name]),
                set: (value) => (this[attribute.name] = value)
            },
            // Now set the handles for the actual name
            // Overrides above if attribute.name is already all lower case
            [attribute.name]: {
                enumerable: true,
                // Get and set the value from the internally scoped object
                get: () => (resource[attribute.name]),
                set: (value) => {
                    let {name, config: {mutable}} = attribute;
                    
                    // Check for mutability of attribute before setting the value
                    if (mutable !== true && this[name] !== undefined && this[name] !== value)
                        throw new SCIMError(400, "mutability", `Attribute '${name}' already defined and is not mutable`);
                    
                    try {
                        // Validate the supplied value through attribute coercion
                        return (resource[name] = attribute.coerce(value, direction));
                    } catch (ex) {
                        // Rethrow attribute coercion exceptions as SCIM errors
                        throw new SCIMError(400, "invalidValue", ex.message);
                    }
                }
            }
        });
        
        // Predefine getters and setters for all schema extensions
        for (let extension of extensions) Object.defineProperties(this, {
            // Same as above, who needs case sensitivity?
            [extension.id.toLowerCase()]: {
                get: () => (this[extension.id]),
                set: (value) => (this[extension.id] = value)
            },
            // Set the handles for the actual extension ID
            [extension.id]: {
                enumerable: true,
                // Get and set the value from the internally scoped object
                get: () => {
                    // Do some cleanup if the extension actually has a value
                    if (resource[extension.id] !== undefined) {
                        let target = resource[extension.id];
                        
                        for (let key of Object.keys(target)) {
                            // Go through and delete any undefined properties or complex attributes without actual values
                            if (target[key] === undefined || (Object(target[key]) === target[key]
                                && !Object.keys(target[key]).some(k => target[key][k] !== undefined))) {
                                delete target[key];
                            }
                        }
                        
                        // If no attributes with values remaining, delete the extension namespace from the instance
                        if (!Object.keys(resource[extension.id]).some(k => resource[extension.id][k] !== undefined))
                            delete resource[extension.id];
                    }
        
                    return resource[extension.id];
                },
                set: (value) => {
                    try {
                        // Validate the supplied value through schema extension coercion
                        return (resource[extension.id] = extension.coerce(value, direction)) && resource[extension.id];
                    } catch (ex) {
                        // Rethrow attribute coercion exceptions as SCIM errors
                        throw new SCIMError(400, "invalidValue", ex.message);
                    }
                }
            },
            // Predefine namespaced getters and setters for schema extension attributes
            ...extension.attributes.reduce((definitions, attribute) => Object.assign(definitions, {
                // Lower-case getter/setter aliases to work around case sensitivity, as above
                [`${extension.id.toLowerCase()}:${attribute.name.toLowerCase()}`]: {
                    get: () => (this[`${extension.id}:${attribute.name}`]),
                    set: (value) => (this[`${extension.id}:${attribute.name}`] = value)
                },
                // Proper-case namespaced extension attributes
                [`${extension.id}:${attribute.name}`]: {
                    get: () => (this[extension.id]?.[attribute.name]),
                    // Trigger setter for the actual schema extension property
                    set: (value) => (this[extension.id] = Object.assign(this[extension.id] ?? {}, {[attribute.name]: value}))
                }
            }), {})
        });
        
        // Prevent attributes from being added or removed
        Object.freeze(this);
    }
}