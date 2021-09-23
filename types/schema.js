import {SchemaDefinition} from "./definition.js";
import {Attribute} from "./attribute.js";
import {SCIMError} from "./error.js";

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
        throw new TypeError("Method 'get' for property 'definition' must be implemented by subclass");
    }
    
    /**
     * Stores a schema's definition instance
     * @type {SchemaDefinition}
     * @abstract
     */
    static #definition;
    
    /**
     * Extend a schema by mixing in other schemas or attributes
     * @param {Array[Schema|Attribute>]} extension - the schema extensions or collection of attributes to register
     * @param {Boolean} [required=false] - if the extension is a schema, whether or not the extension is required
     */
    static extend(extension, required = false) {
        this.definition.extend((extension.prototype instanceof Schema ? extension.definition : extension), required);
    }
    
    /**
     * Remove an attribute or subAttribute from the schema definition
     * @param {String|String[]|Attribute|Attribute[]} attributes - the child attributes to remove from the schema definition
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
        for (let attribute of attributes) Object.defineProperty(this, attribute.name, {
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
        });
        
        // Prevent unknown attributes from being added
        Object.preventExtensions(this);
    }
}