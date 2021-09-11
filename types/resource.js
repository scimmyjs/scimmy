import {SCIMError} from "./error.js";
import {Filter} from "./filter.js";

/**
 * SCIM Resource
 * @interface
 */
export class Resource {
    /**
     * Retrieves a resource's core schema
     * @returns {Schema}
     * @abstract
     */
    static get schema() {
        throw new TypeError("Method 'get' for property 'schema' must be implemented by subclass");
    }
    
    /**
     * List of extensions to a resource's core schema
     * @type {Object[]}
     * @abstract
     */
    static #extensions;
    /**
     * Get the list of registered schema extensions for a resource
     * @abstract
     */
    static get extensions() {
        throw new TypeError("Method 'get' for property 'extensions' must be implemented by subclass");
    }
    
    /**
     * Register an extension to the resource's core schema
     * @param {Schema} extension - the schema extension to register
     * @param {Boolean} required - whether or not the extension is required
     */
    static extend(extension, required) {
        throw new TypeError("Method 'basepath' must be implemented by subclass");
    }
    
    /**
     * Retrieves a resource's endpoint relative to the service provider's base URL
     * @returns {String}
     * @abstract
     */
    static get endpoint() {
        throw new TypeError("Method 'get' for property 'endpoint' must be implemented by subclass");
    }
    
    /**
     * Base path for resource's location
     * @type {String}
     * @abstract
     */
    static #basepath;
    /**
     * Sets or retrieves the base path for resolution of a resource's location
     * @param {String} path - the path to use as the base of a resource's location
     * @abstract
     */
    static basepath(path) {
        throw new TypeError("Method 'basepath' must be implemented by subclass");
    }
    
    /**
     * Handler for ingress/egress of a resource
     * @callback Resource~gressHandler
     * @param {Resource} - the resource performing the ingress/egress
     */
    
    /**
     * Ingress handler storage property
     * @type {Function}
     * @abstract
     */
    static #ingress;
    /**
     * Sets the method to be called to retrieve a resource on read
     * @param {Resource~gressHandler} handler - function to invoke to retrieve a resource on read
     * @abstract
     */
    static ingress(handler) {
        throw new TypeError("Method 'ingress' must be implemented by subclass");
    }
    
    /**
     * Egress handler storage property
     * @type {Function}
     * @abstract
     */
    static #egress;
    /**
     * Sets the method to be called to consume a resource on write
     * @param {Resource~gressHandler} handler - function to invoke to retrieve a resource on read
     * @abstract
     */
    static egress(handler) {
        throw new TypeError("Method 'egress' must be implemented by subclass");
    }
    
    /**
     * Describe this resource implementation
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
     * @param {Object|String} [config={}] - the parameters of the resource instance if object, or the resource ID if string
     * @param {String} [config.filter] - the filter to be applied on ingress by implementing resource
     * @param {*[]} [rest] - all other arguments supplied to the resource constructor
     */
    constructor(config = {}, ...rest) {
        let params = config;
        
        if (typeof config === "string") {
            this.id = config;
            params = rest.shift() ?? {};
            params.filter = `id eq "${this.id}"`;
        }
        
        if (params.filter) this.filter = new Filter(params.filter);
        if (params.attributes) {
            if (typeof params.attributes !== "string")
                throw new SCIMError(400, "invalidFilter", "Expected attributes to be a comma-separated string list");
            
            // TODO: decode attributes specified in filter format
            this.attributes = params.attributes.split(",");
        }
    }
    
    /**
     * Calls resource's egress method and wraps the results in valid SCIM list response or single resource syntax
     * @abstract
     */
    read() {
        throw new TypeError("Method 'read' must be implemented by subclass");
    }
    
    /**
     * Calls resource's ingress method for consumption after unwrapping the SCIM resource
     * @abstract
     */
    write() {
        throw new TypeError("Method 'readOne' must be implemented by subclass");
    }
}