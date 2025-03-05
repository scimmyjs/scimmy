import {SchemaDefinition} from "./definition.js";
import {Attribute} from "./attribute.js";
import {SCIMError} from "./error.js";

/**
 * Define the "toJSON" property for the given target
 * @param {Object} target - the object to define the "toJSON" property on
 * @param {SchemaDefinition} definition - the schema definition associated with the target
 * @param {Object} resource - the underlying resource associated with the target
 * @returns {Object} the original target object, with the "toJSON" property defined
 * @private
 */
const defineToJSONProperty = (target, definition, resource) => Object.defineProperty(target, "toJSON", {
    value: () => Object.entries(resource)
        .filter(([name]) => ![false, "never"].includes(definition.attribute(name)?.config?.returned))
        .reduce((res, [name, value]) => Object.assign(res, {[name]: value}), {})
});

/**
 * Deeply check whether a targeted object has any properties with actual values
 * @param {Object} target - object to deeply check for values
 * @returns {Boolean} whether the target object, or any of its object properties, have a value other than undefined
 * @private
 */
const hasActualValues = (target) => (Object.values(target).some((v) => typeof v === "object" ? hasActualValues(v) : v !== undefined));

/**
 * Create property descriptor definitions for an attribute
 * @param {SCIMMY.Types.Attribute} attribute - the attribute to create the property descriptors for
 * @param {Object} resource - the object storing underlying data
 * @param {Object} receiver - the object where the accessors are being defined
 * @param {String} direction - whether the resource is inbound from a request or outbound for a response
 * @returns {Object} the property descriptors for the attribute, to be passed to Object.defineProperties
 * @private
 */
const describeAttributeAccessors = (attribute, resource, receiver, direction) => ({
    // Because why bother with case-sensitivity in a JSON-based standard?
    // See: RFC7643§2.1 (https://datatracker.ietf.org/doc/html/rfc7643#section-2.1)
    [attribute.name.toLowerCase()]: {
        get: () => (receiver[attribute.name]),
        set: (value) => (receiver[attribute.name] = value)
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
            if (mutable !== true && receiver[name] !== undefined && receiver[name] !== value)
                throw new SCIMError(400, "mutability", `Attribute '${name}' already defined and is not mutable`);
            
            try {
                // Validate the supplied value through attribute coercion
                resource[name] = attribute.coerce(value, direction);
            } catch (ex) {
                // Rethrow attribute coercion exceptions as SCIM errors
                throw new SCIMError(400, "invalidValue", ex.message);
            }
            
            // Indicate resource value has been set
            return true;
        }
    }
});

/**
 * Automatically assigned attributes not required in schema extension values
 * @enum {"id"|"schemas"|"meta"} SCIMMY.Types.Schema~ShadowAttributes
 * @ignore
 */

/**
 * A schema instance type with an added schema extension
 * @typedef {V} SCIMMY.Types.Schema~Extended
 * @template {SCIMMY.Types.Schema} S
 * @template {typeof SCIMMY.Types.Schema} E
 * @template {S} [V=(S & {[K in keyof Pick<E, "id"> as `${E[K]}`]?: Omit<InstanceType<E>, Schema.ShadowAttributes>})]
 * @ignore
 */

/**
 * SCIM Schema Type
 * @alias SCIMMY.Types.Schema
 * @summary
 * *   Extendable class which provides the ability to construct resource instances with automated validation of conformity to a resource's schema definition.
 * *   Once instantiated, any modifications will also be validated against the attached schema definition's matching attribute configuration (e.g. for mutability or canonical values).
 */
export class Schema {
    /**
     * SCIM schema URN namespace
     * @type {String}
     * @abstract
     */
    static get id() {
        throw new TypeError("Method 'get' for static property 'id' must be implemented by subclass");
    }
    
    /**
     * Retrieves a schema's definition instance
     * @type {SCIMMY.Types.SchemaDefinition}
     * @abstract
     */
    static get definition() {
        throw new TypeError("Method 'get' for static property 'definition' must be implemented by subclass");
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
     * Remove an attribute, schema extension, or subAttribute from the schema's definition
     * @param {SCIMMY.Types.Schema|String|SCIMMY.Types.Attribute|Array<String>|Array<SCIMMY.Types.Attribute>} attributes - the child attributes to remove from the schema definition
     */
    static truncate(attributes) {
        this.definition.truncate(attributes?.prototype instanceof Schema ? attributes.definition : attributes);
    }
    
    /**
     * Construct a resource instance after verifying schema compatibility
     * @param {Object} data - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @property {String} id - unique identifier for a SCIM resource as defined by the service provider
     * @property {String[]} schemas - namespace URIs of the SCIM schemas that define the attributes present in the current data structure
     * @property {String} [externalId] - identifier for the resource as defined by the provisioning client
     * @property {Object} meta - a complex attribute containing resource metadata
     * @property {String} meta.resourceType - name of the resource type of the resource
     * @property {Date} [meta.created] - when the resource was added to the service provider
     * @property {Date} [meta.lastModified] - when this resource was last updated at the service provider
     * @property {String} meta.location - full, canonical URI of the resource being returned
     * @property {String} [meta.version] - version of the resource being returned, if any
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
        // Set "toJSON" method on self so attributes can be filtered
        defineToJSONProperty(this, definition, resource);
        
        // Predefine getters and setters for all possible attributes
        for (let attribute of attributes) Object.defineProperties(this, describeAttributeAccessors(attribute, resource, this, direction));
        
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
                        if (value === undefined || (Object(value) === value && !hasActualValues(value)))
                            delete resource[extension.id][key];
                    }
                    
                    // If no attributes with values remaining, return undefined
                    if (!hasActualValues(resource[extension.id] ?? {})) return undefined;
                    // Otherwise, return a pre-structured receiver for the extension
                    else {
                        // Set up the receiver with JSON stringifier attached
                        const receiver = defineToJSONProperty({}, extension, resource[extension.id]);
                        
                        // Predefine getters and setters for all possible extension attributes
                        for (let attribute of extension.attributes)
                            Object.defineProperties(receiver, describeAttributeAccessors(attribute, resource[extension.id], receiver, direction));
                        
                        // Prevent additional attributes being added to the extension
                        return Object.preventExtensions(receiver);
                    }
                },
                set: (value) => {
                    try {
                        // If no actual values, remove extension schema ID from schemas and unset value
                        if (!hasActualValues(value)) {
                            resource.schemas = resource.schemas.filter(id => id !== extension.id);
                            delete resource[extension.id];
                        }
                        // Otherwise, add extension schema ID and set the value
                        else {
                            // Validate the supplied value through schema extension coercion
                            resource[extension.id] = extension.coerce(value, direction);
                            
                            // If the extension now has a value when it didn't before, add schema ID to schemas
                            if (!!resource[extension.id] && !resource.schemas.includes(extension.id))
                                resource.schemas.push(extension.id);
                            
                            // Attach JSON stringifier and set the value back to the instance
                            defineToJSONProperty(resource[extension.id], extension, resource[extension.id]);
                            Object.assign(Object.preventExtensions(this[extension.id] ?? {}), value);
                        }
                    } catch (ex) {
                        // Rethrow attribute coercion exceptions as SCIM errors
                        throw new SCIMError(400, "invalidValue", ex.message);
                    }
                    
                    // Indicate resource value has been set
                    return true;
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
                            
                            // Set the actual value...
                            target[attribute.name] = value;
                            // ...then assign it back to the extension for coercion
                            this[extension.id] = Object.assign(this[extension.id] ?? {}, data);
                            
                            // Indicate resource value has been set
                            return true;
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