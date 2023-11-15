import {SCIMError} from "./error.js";
import {SchemaDefinition} from "./definition.js";
import {Schema} from "./schema.js";
import {Filter} from "./filter.js";

/**
 * SCIM Resource Type
 * @alias SCIMMY.Types.Resource
 * @summary
 * *   Extendable class representing a SCIM Resource Type, which acts as an interface between a SCIM resource type schema, and an app's internal data model.
 * *   Handles incoming requests to read/write/delete a resource, parses any attribute, filter, and sort parameters of a request, and formats responses for consumption by other SCIM clients and service providers.
 */
export class Resource {
    /**
     * Retrieves a resource's endpoint relative to the service provider's base URL
     * @type {String}
     * @abstract
     */
    static get endpoint() {
        throw new TypeError(`Method 'get' for property 'endpoint' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Base path for resource's location
     * @type {String}
     * @private
     * @abstract
     */
    static #basepath;
    /**
     * Sets or retrieves the base path for resolution of a resource's location
     * @param {String} [path] - the path to use as the base of a resource's location
     * @returns {SCIMMY.Types.Resource|String} this resource type class for chaining if path is a string, or the resource's basepath
     * @abstract
     */
    static basepath(path) {
        throw new TypeError(`Method 'basepath' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Retrieves a resource's core schema
     * @type {typeof SCIMMY.Types.Schema}
     * @abstract
     */
    static get schema() {
        throw new TypeError(`Method 'get' for property 'schema' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Register an extension to the resource's core schema
     * @param {typeof SCIMMY.Types.Schema} extension - the schema extension to register
     * @param {Boolean} [required] - whether the extension is required
     * @returns {SCIMMY.Types.Resource|void} this resource type implementation for chaining
     */
    static extend(extension, required) {
        this.schema.extend(extension, required);
        
        return this;
    }
    
    /**
     * Handler for ingress/egress/degress of a resource
     * @callback SCIMMY.Types.Resource~gressHandler
     * @param {SCIMMY.Types.Resource} resource - the resource performing the ingress/egress/degress
     * @param {SCIMMY.Types.Schema} [instance] - an instance of the resource type that conforms to the resource's schema
     */
    
    /**
     * Ingress handler method storage property
     * @type {SCIMMY.Types.Resource~gressHandler}
     * @private
     * @abstract
     */
    static #ingress;
    /**
     * Sets the method to be called to consume a resource on create
     * @param {SCIMMY.Types.Resource~gressHandler} handler - function to invoke to consume a resource on create
     * @returns {SCIMMY.Types.Resource} this resource type class for chaining
     * @abstract
     */
    static ingress(handler) {
        throw new TypeError(`Method 'ingress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Egress handler method storage property
     * @type {SCIMMY.Types.Resource~gressHandler}
     * @private
     * @abstract
     */
    static #egress;
    /**
     * Sets the method to be called to retrieve a resource on read
     * @param {SCIMMY.Types.Resource~gressHandler} handler - function to invoke to retrieve a resource on read
     * @returns {SCIMMY.Types.Resource} this resource type class for chaining
     * @abstract
     */
    static egress(handler) {
        throw new TypeError(`Method 'egress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Degress handler method storage property
     * @type {SCIMMY.Types.Resource~gressHandler}
     * @private
     * @abstract
     */
    static #degress;
    /**
     * Sets the method to be called to dispose of a resource on delete
     * @param {SCIMMY.Types.Resource~gressHandler} handler - function to invoke to dispose of a resource on delete
     * @returns {SCIMMY.Types.Resource} this resource type class for chaining
     * @abstract
     */
    static degress(handler) {
        throw new TypeError(`Method 'degress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Describe this resource type implementation
     * @returns {SCIMMY.Types.Resource~ResourceType} object describing the resource type implementation 
     */
    static describe() {
        // Find all schema definitions that extend this resource's definition...
        const findSchemaDefinitions = (d) => d.attributes.filter(a => a instanceof SchemaDefinition)
            .map(e => ([e, ...findSchemaDefinitions(e)])).flat(Infinity);
        // ...so they can be included in the returned description
        const schemaExtensions = [...new Set(findSchemaDefinitions(this.schema.definition))]
            .map(({id: schema, required}) => ({schema, required}));
        
        /**
         * @typedef {Object} SCIMMY.Types.Resource~ResourceType
         * @property {String} id - URN namespace of the resource's SCIM schema definition
         * @property {String} name - friendly name of the resource's SCIM schema definition
         * @property {String} endpoint - resource type's endpoint, relative to a service provider's base URL
         * @property {String} description - human-readable description of the resource
         * @property {Object} [schemaExtensions] - schema extensions that augment the resource
         * @property {String} schemaExtensions[].schema - URN namespace of the schema extension that augments the resource
         * @property {Boolean} schemaExtensions[].required - whether resource instances must include the schema extension
         */
        return {
            id: this.schema.definition.name, name: this.schema.definition.name, endpoint: this.endpoint,
            description: this.schema.definition.description, schema: this.schema.definition.id,
            ...(schemaExtensions.length ? {schemaExtensions} : {})
        };
    }
    
    /**
     * Instantiate a new SCIM resource and parse any supplied parameters
     * @param {String} [id] - the ID of the requested resource
     * @param {Object} [config={}] - the parameters of the resource instance request
     * @param {String} [config.filter] - the filter to be applied on ingress/egress by implementing resource
     * @param {String} [config.excludedAttributes] - the comma-separated string list of attributes or filters to exclude on egress
     * @param {String} [config.attributes] - the comma-separated string list of attributes or filters to include on egress
     * @param {String} [config.sortBy] - the attribute retrieved resources should be sorted by
     * @param {String} [config.sortOrder] - the direction retrieved resources should be sorted in
     * @param {Number} [config.startIndex] - offset index that retrieved resources should start from
     * @param {Number} [config.count] - maximum number of retrieved resources that should be returned in one operation
     * @property {String} [id] - ID of the resource instance being targeted
     * @property {SCIMMY.Types.Filter} [filter] - filter parsed from the supplied config
     * @property {SCIMMY.Types.Filter} [attributes] - attributes or excluded attributes parsed from the supplied config
     * @property {Object} [constraints] - sort and pagination properties parsed from the supplied config
     * @property {String} [constraints.sortBy] - the attribute retrieved resources should be sorted by
     * @property {String} [constraints.sortOrder] - the direction retrieved resources should be sorted in
     * @property {Number} [constraints.startIndex] - offset index that retrieved resources should start from
     * @property {Number} [constraints.count] - maximum number of retrieved resources that should be returned in one operation
     */
    constructor(id, config) {
        // Unwrap params from arguments
        const params = (typeof id === "string" || config !== undefined ? config : id) ?? {};
        
        // Make sure params is a valid object
        if (Object(params) !== params || Array.isArray(params))
            throw new SCIMError(400, "invalidSyntax", "Expected query parameters to be a single complex object value");
        // Make sure ID is valid
        if ((id !== undefined && Object(id) !== params) && (String(id) !== id || !id.length))
            throw new SCIMError(400, "invalidSyntax", "Expected 'id' parameter to be a non-empty string");
        
        // Handle case where ID is supplied as first argument
        if (typeof id === "string") {
            // Store the ID and create a filter to match the ID 
            this.id = id;
            this.filter = new Filter(`id eq "${this.id}"`);
        }
        // Parse the filter if it exists, and wasn't set by ID above
        else if ("filter" in params) {
            // Bail out if filter isn't a non-empty string
            if (typeof params.filter !== "string" || !params.filter.trim().length)
                throw new SCIMError(400, "invalidFilter", "Expected filter to be a non-empty string");
            
            this.filter = new Filter(params.filter);
        }
        
        // Handle excluded attributes
        if ("excludedAttributes" in params) {
            // Bail out if excludedAttributes isn't a non-empty string
            if (typeof params.excludedAttributes !== "string" || !params.excludedAttributes.trim().length)
                throw new SCIMError(400, "invalidFilter", "Expected excludedAttributes to be a comma-separated list string");
            
            // Convert excludedAttributes into a filter string, and instantiate a new filter
            this.attributes = new Filter(params.excludedAttributes.split(",").map(a => `${a} np`).join(" and "));
        }
        
        // Handle attributes (overwrites excluded attributes if previously defined)
        if ("attributes" in params) {
            // Bail out if attributes isn't a non-empty string
            if (typeof params.attributes !== "string" || !params.attributes.trim().length)
                throw new SCIMError(400, "invalidFilter", "Expected attributes to be a comma-separated list string");
            
            // Convert attributes into a filter string, and instantiate a new filter
            this.attributes = new Filter(params.attributes.split(",").map(a => `${a} pr`).join(" and "));
        }
        
        // Handle sort and pagination parameters
        if (["sortBy", "sortOrder", "startIndex", "count"].some(k => k in params)) {
            const {sortBy, sortOrder, startIndex, count} = params;
            
            this.constraints = {
                ...(typeof sortBy === "string" ? {sortBy} : {}),
                ...(["ascending", "descending"].includes(sortOrder) ? {sortOrder} : {}),
                ...(!Number.isNaN(Number(startIndex)) && Number.isInteger(startIndex) ? {startIndex} : {}),
                ...(!Number.isNaN(Number(count)) && Number.isInteger(count) ? {count} : {})
            };
        }
    }
    
    /**
     * Calls resource's egress method for data retrieval.
     * Wraps the results in valid SCIM list response or single resource syntax.
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Types.Schema}
     * *   A collection of resources matching instance's configured filter, if no ID was supplied to resource constructor.
     * *   The specifically requested resource instance, if an ID was supplied to resource constructor.
     * @abstract
     */
    read() {
        throw new TypeError(`Method 'read' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Calls resource's ingress method for consumption after unwrapping the SCIM resource
     * @param {Object} instance - the raw resource type instance for consumption by ingress method
     * @returns {SCIMMY.Types.Schema} the consumed resource type instance
     * @abstract
     */
    write(instance) {
        throw new TypeError(`Method 'write' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Retrieves resources via egress method, and applies specified patch operations.
     * Emits patched resources for consumption with resource's ingress method.
     * @param {Object} message - the PatchOp message to apply to the received resource
     * @returns {SCIMMY.Types.Schema} the resource type instance after patching and consumption by ingress method
     * @abstract
     */
    patch(message) {
        throw new TypeError(`Method 'patch' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Calls resource's degress method for disposal of the SCIM resource
     * @abstract
     */
    dispose() {
        throw new TypeError(`Method 'dispose' not implemented by resource '${this.constructor.name}'`);
    }
}