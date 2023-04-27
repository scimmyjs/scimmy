import {SchemaDefinition} from "./definition.js";
import {Attribute} from "./attribute.js";
import {SCIMError} from "./error.js";

/**
 * Deeply check whether a targeted object has any properties with actual values
 * @param {Object} target - object to deeply check for values
 * @returns {Boolean} whether the target object, or any of its object properties, have a value other than undefined
 * @private
 */
const hasActualValues = (target) => (Object.values(target).some((v) => typeof v === "object" ? hasActualValues(v) : v !== undefined));

/**
 * SCIM Schema Type
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
     * @param {Boolean} [required=false] - if the extension is a schema, whether the extension is required
     */
    static extend(extension, required = false) {
        if (!(extension instanceof SchemaDefinition) && !(extension?.prototype instanceof Schema)
            && !(Array.isArray(extension) ? extension : [extension]).every(e => e instanceof Attribute))
            throw new TypeError("Expected 'extension' to be a Schema class, SchemaDefinition instance, or collection of Attribute instances");
        
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
        const {schemas = []} = data;
        // Create internally scoped storage object
        const resource = {};
        // Source attributes and extensions from schema definition
        const {definition} = this.constructor;
        const attributes = definition.attributes.filter(a => a instanceof Attribute);
        const extensions = definition.attributes.filter(a => a instanceof SchemaDefinition);
        
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
        
        // Save the directionality of this instance to a symbol for use elsewhere
        Object.defineProperty(this, Symbol.for("direction"), {value: direction});
        
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
                    const {name, config: {mutable}} = attribute;
                    
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
                    // Go through and delete any undefined properties or complex attributes without actual values
                    for (let [key, value] of Object.entries(resource[extension.id] ?? {})) {
                        if (value === undefined || (Object(value) === value && !hasActualValues(value))) {
                            delete resource[extension.id][key];
                        }
                    }
                    
                    // If no attributes with values remaining, return undefined
                    return !hasActualValues(resource[extension.id] ?? {}) ? undefined : resource[extension.id];
                },
                set: (value) => {
                    try {
                        // Validate the supplied value through schema extension coercion
                        resource[extension.id] = extension.coerce(value, direction);
                        
                        return Object.assign(Object.preventExtensions(resource[extension.id]), value);
                    } catch (ex) {
                        // Rethrow attribute coercion exceptions as SCIM errors
                        throw new SCIMError(400, "invalidValue", ex.message);
                    }
                }
            },
            // Predefine namespaced getters and setters for schema extension attributes
            ...extension.attributes.reduce((() => {
                const getExtensionReducer = (path = "") => (definitions, attribute) => Object.assign(definitions, {
                    // Lower-case getter/setter aliases to work around case sensitivity, as above
                    [`${extension.id}:${path}${attribute.name}`.toLowerCase()]: {
                        get: () => (this[`${extension.id}:${path}${attribute.name}`]),
                        set: (value) => (this[`${extension.id}:${path}${attribute.name}`] = value)
                    },
                    // Proper-case namespaced extension attributes
                    [`${extension.id}:${path}${attribute.name}`]: {
                        get: () => {
                            // Get the underlying nested path of the attribute
                            const paths = path.replace(/([.])$/, "").split(".").filter(p => !!p);
                            let target = this[extension.id];
                            
                            // Go through the attribute path on the extension to find the actual target
                            while (paths.length) target = target?.[paths.shift()];
                            
                            return target?.[attribute.name];
                        },
                        // Trigger setter for the actual schema extension property
                        set: (value) => {
                            // Get the underlying nested path of the attribute, and a copy of the data to set
                            const paths = path.replace(/([.])$/, "").split(".").filter(p => !!p);
                            let target = {...this[extension.id]}, data = target;
                            
                            // Go through the attribute path on the extension...
                            while (paths.length) {
                                const path = paths.shift();
                                
                                // ...and set any missing container paths along the way
                                target = target[path] = {...(target?.[path] ?? {})};
                            }
                            
                            // Set the actual value
                            target[attribute.name] = value;
                            
                            // Then assign it back to the extension for coercion
                            return (this[extension.id] = Object.assign(this[extension.id] ?? {}, data));
                        }
                    },
                    // Go through the process again for subAttributes
                    ...(attribute.subAttributes ? attribute.subAttributes.reduce(getExtensionReducer(`${path}${attribute.name}.`), {}) : {})
                });
                
                return getExtensionReducer();
            })(), {})
        });
        
        // Prevent attributes from being added or removed
        Object.freeze(this);
    }
}