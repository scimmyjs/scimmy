import {SCIMError} from "./error.js";
import {Schema} from "./schema.js";
import {Filter} from "./filter.js";

/**
 * SCIM Resource
 * @alias SCIMMY.Types.Resource
 */
export class Resource {
    /**
     * Retrieves a resource's endpoint relative to the service provider's base URL
     * @static
     * @alias endpoint
     * @memberOf SCIMMY.Types.Resource
     * @returns {String}
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
     * @static
     * @alias basepath
     * @memberOf SCIMMY.Types.Resource
     * @param {String} path - the path to use as the base of a resource's location
     * @abstract
     */
    static basepath(path) {
        throw new TypeError(`Method 'basepath' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Retrieves a resource's core schema
     * @static
     * @alias schema
     * @memberOf SCIMMY.Types.Resource
     * @returns {SCIMMY.Types.Schema}
     * @abstract
     */
    static get schema() {
        throw new TypeError(`Method 'get' for property 'schema' not implemented by resource '${this.name}'`);
    }
    
    /**
     * List of extensions to a resource's core schema
     * @type {Object[]}
     * @private
     * @abstract
     */
    static #extensions;
    /**
     * Get the list of registered schema extensions for a resource
     * @static
     * @alias extensions
     * @memberOf SCIMMY.Types.Resource
     * @returns {Object[]}
     * @abstract
     */
    static get extensions() {
        throw new TypeError(`Method 'get' for property 'extensions' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Register an extension to the resource's core schema
     * @static
     * @alias extend
     * @memberOf SCIMMY.Types.Resource
     * @param {SCIMMY.Types.Schema|SCIMMY.Types.Attribute[]} extension - the schema extension to register
     * @param {Boolean} required - whether or not the extension is required
     * @returns {SCIMMY.Types.Resource|void} this resource type implementation for chaining
     */
    static extend(extension, required) {
        if (!this.extensions.find(e => e.schema === extension)) {
            if (extension instanceof Schema) this.extensions.push({schema: extension, required: required});
            this.schema.extend(extension, required);
        }
        
        return this;
    }
    
    /**
     * Handler for ingress/egress/degress of a resource
     * @callback Resource~gressHandler
     * @param {SCIMMY.Types.Resource} resource - the resource performing the ingress/egress/degress
     * @param {SCIMMY.Types.Schema} [instance] - an instance of the resource type that conforms to the resource's schema
     */
    
    /**
     * Ingress handler method storage property
     * @type {Resource~gressHandler}
     * @private
     * @abstract
     */
    static #ingress;
    /**
     * Sets the method to be called to consume a resource on create
     * @static
     * @alias ingress
     * @memberOf SCIMMY.Types.Resource
     * @param {Resource~gressHandler} handler - function to invoke to consume a resource on create
     * @abstract
     */
    static ingress(handler) {
        throw new TypeError(`Method 'ingress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Egress handler method storage property
     * @type {Resource~gressHandler}
     * @private
     * @abstract
     */
    static #egress;
    /**
     * Sets the method to be called to retrieve a resource on read
     * @static
     * @alias egress
     * @memberOf SCIMMY.Types.Resource
     * @param {Resource~gressHandler} handler - function to invoke to retrieve a resource on read
     * @abstract
     */
    static egress(handler) {
        throw new TypeError(`Method 'egress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Degress handler method storage property
     * @type {Resource~gressHandler}
     * @private
     * @abstract
     */
    static #degress;
    /**
     * Sets the method to be called to dispose of a resource on delete
     * @static
     * @alias degress
     * @memberOf SCIMMY.Types.Resource
     * @param {Resource~gressHandler} handler - function to invoke to dispose of a resource on delete
     * @abstract
     */
    static degress(handler) {
        throw new TypeError(`Method 'degress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Describe this resource implementation
     * @static
     * @alias describe
     * @memberOf SCIMMY.Types.Resource
     * @returns {{schema: String, endpoint: String, name: String, description: String, id: String}}
     */
    static describe() {
        return {
            id: this.schema.definition.name, name: this.schema.definition.name, endpoint: this.endpoint,
            description: this.schema.definition.description, schema: this.schema.definition.id,
            ...(this.extensions.length === 0 ? {} : {
                schemaExtensions: this.extensions.map(E => ({schema: E.schema.definition.id, required: E.required}))
            })
        };
    }
    
    /**
     * Instantiate a new SCIM resource and parse any supplied parameters
     * @constructs SCIMMY.Types.Resource
     * @param {Object|String} [config={}] - the parameters of the resource instance if object, or the resource ID if string
     * @param {String} [config.filter] - the filter to be applied on ingress/egress by implementing resource
     * @param {String} [config.excludedAttributes] - the comma-separated string list of attributes or filters to exclude on egress
     * @param {String} [config.attributes] - the comma-separated string list of attributes or filters to include on egress
     * @param {any[]} rest - all other arguments supplied to the resource constructor
     */
    constructor(config = {}, ...rest) {
        let params = config;
        
        // Handle case where ID is supplied as first argument
        if (typeof config === "string") {
            // Store the ID and get the real parameters
            this.id = config;
            params = rest.shift() ?? {};
            
            // Create a filter to match the ID
            params.filter = `id eq "${this.id}"`;
        }
        
        // Parse the filter if it exists
        if (params.filter) this.filter = new Filter(params.filter);
        
        // Handle excluded attributes
        if (params.excludedAttributes) {
            // Bail out if excludedAttributes isn't a string
            if (typeof params.excludedAttributes !== "string")
                throw new SCIMError(400, "invalidFilter", "Expected excludedAttributes to be a comma-separated string list");
            
            // Convert excludedAttributes into a filter string, and instantiate a new filter
            this.attributes = new Filter(params.excludedAttributes.split(",").map(a => `${a} np`).join(" and "));
        }
        
        // Handle attributes (overwrites excluded attributes if previously defined)
        if (params.attributes) {
            // Bail out if attributes isn't a string
            if (typeof params.attributes !== "string")
                throw new SCIMError(400, "invalidFilter", "Expected attributes to be a comma-separated string list");
            
            // Convert attributes into a filter string, and instantiate a new filter
            this.attributes = new Filter(params.attributes.split(",").map(a => `${a} pr`).join(" and "));
        }
        
        // Handle sort and pagination parameters
        if (["sortBy", "sortOrder", "startIndex", "count"].some(k => k in params)) {
            let {sortBy, sortOrder, startIndex: sStartIndex, count: sCount} = params,
                startIndex = Number(sStartIndex ?? undefined),
                count = Number(sCount ?? undefined);
            
            this.constraints = {
                ...(sortBy !== undefined ? {sortBy: sortBy} : {}),
                ...(["ascending", "descending"].includes(sortOrder) ? {sortOrder: sortOrder} : {}),
                ...(!Number.isNaN(startIndex) && Number.isInteger(startIndex) ? {startIndex: startIndex} : {}),
                ...(!Number.isNaN(count) && Number.isInteger(count) ? {count: count} : {})
            };
        }
    }
    
    /**
     * Calls resource's egress method for data retrieval
     * Wraps the results in valid SCIM list response or single resource syntax
     * @alias read
     * @memberOf SCIMMY.Types.Resource
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Types.Schema}
     * @abstract
     */
    read() {
        throw new TypeError(`Method 'read' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Calls resource's ingress method for consumption after unwrapping the SCIM resource
     * @alias write
     * @memberOf SCIMMY.Types.Resource
     * @returns {SCIMMY.Types.Schema}
     * @abstract
     */
    write() {
        throw new TypeError(`Method 'write' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Retrieves resources via egress method, and applies specified patch operations
     * Emits patched resources for consumption with resource's ingress method
     * @alias patch
     * @memberOf SCIMMY.Types.Resource
     * @returns {SCIMMY.Types.Schema}
     * @abstract
     */
    patch() {
        throw new TypeError(`Method 'patch' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Calls resource's degress method for disposal of the SCIM resource
     * @alias dispose
     * @memberOf SCIMMY.Types.Resource
     * @abstract
     */
    dispose() {
        throw new TypeError(`Method 'dispose' not implemented by resource '${this.constructor.name}'`);
    }
}