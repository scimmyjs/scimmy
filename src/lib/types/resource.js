import {SCIMError} from "./error.js";
import {SchemaDefinition} from "./definition.js";
import {Filter} from "./filter.js";

/**
 * Automatically assigned attributes not required in handler return values
 * @enum {"schemas"|"meta"} SCIMMY.Types.Resource~ShadowAttributes
 * @ignore
 */

/**
 * SCIM Resource Type
 * @alias SCIMMY.Types.Resource
 * @template {SCIMMY.Types.Schema} [S=*] - type of schema instance that will be passed to handlers
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
     * @internal
     */
    static #basepath;
    /**
     * Sets or retrieves the base path for resolution of a resource's location
     * @template {typeof SCIMMY.Types.Resource<any>} R
     * @param {String} [path] - the path to use as the base of a resource's location
     * @returns {R|String} this resource type class for chaining if path is a string, or the resource's basepath
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
     * @template {typeof SCIMMY.Types.Resource<S>} R
     * @template {SCIMMY.Types.Schema} [S=*] - type of schema instance that will be passed to handlers
     * @param {typeof SCIMMY.Types.Schema} extension - the schema extension to register
     * @param {Boolean} [required] - whether the extension is required
     * @returns {R} this resource type implementation for chaining
     * @abstract
     */
    static extend(extension, required) {
        this.schema.extend(extension, required);
        
        return this;
    }
    
    /**
     * Handler for ingress of a resource
     * @template {SCIMMY.Types.Resource<S>} R - type of resource instance performing ingress
     * @template {SCIMMY.Types.Schema} S - type of schema instance that will be passed to handler
     * @template {Record<String, *>} [V=Omit<Awaited<S>, Resource.ShadowAttributes>] - shape of return value
     * @callback SCIMMY.Types.Resource~IngressHandler
     * @param {R} resource - the resource performing the ingress
     * @param {S} instance - an instance of the resource type that conforms to the resource's schema
     * @param {*} [ctx] - external context in which the handler has been called
     * @returns {V|Promise<V>} an object to be used to create a new schema instance, whose properties conform to the resource type's schema
     * @example
     * // Handle a request to create a new resource, or update an existing resource
     * async function ingress(resource, instance, ctx) {
     *     try {
     *         // Call some external controller to update the resource in your database...
     *         if (resource.id) return await ResourceController.update(resource.id, instance, ctx);
     *         // ...or if a resource ID wasn't specified, to create the resource in your database
     *         else return await ResourceController.create(instance, ctx);
     *     } catch (ex) {
     *         switch (ex.message) {
     *             // Be sure to throw a SCIM 404 error if the specific resource wasn't found...
     *             case "Not Found":
     *                 throw new SCIMMY.Types.Error(404, null, `Resource ${resource.id} not found`);
     *             // ...or a SCIM 409 error if a database unique constraint wasn't met...
     *             case "Not Unique":
     *                 throw new SCIMMY.Types.Error(409, "uniqueness", "Primary email address is not unique");
     *             // ...and also rethrow any other exceptions as SCIM 500 errors
     *             default:
     *                 throw new SCIMMY.Types.Error(500, null, ex.message);
     *         }
     *     }
     * }
     */
    
    /**
     * Ingress handler method storage property
     * @type {SCIMMY.Types.Resource~IngressHandler}
     * @private
     * @abstract
     */
    static #ingress;
    /**
     * Sets the method to be called to consume a resource on create
     * @template {typeof SCIMMY.Types.Resource<any>} R
     * @template {SCIMMY.Types.Schema} S
     * @typeParam {S} [V=S]
     * @param {SCIMMY.Types.Resource~IngressHandler<InstanceType<R>, V>} handler - function to invoke to consume a resource on create
     * @returns {R} this resource type class for chaining
     * @abstract
     */
    static ingress(handler) {
        throw new TypeError(`Method 'ingress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Handler for egress of a resource
     * @template {SCIMMY.Types.Resource<S>} R - type of resource instance performing egress
     * @template {SCIMMY.Types.Schema} S - type of schema instance that will be passed to handler
     * @template {Record<String, *>} [V=Omit<Awaited<S>, Resource.ShadowAttributes>] - shape of return value
     * @callback SCIMMY.Types.Resource~EgressHandler
     * @param {R} resource - the resource performing the egress
     * @param {*} [ctx] - external context in which the handler has been called
     * @returns {V|Array<V>|Promise<V|Array<V>>} an object, or array of objects, to be used to create a new schema instances, whose properties conform to the resource type's schema
     * @example
     * // Handle a request to retrieve a specific resource, or a list of resources
     * async function egress(resource, ctx) {
     *     try {
     *         // Call some external controller to retrieve the specified resource from your database...
     *         if (resource.id) return await ResourceController.findOne(resource.id, ctx);
     *         // ...or if a resource ID wasn't specified, to retrieve a list of matching resources from your database
     *         else return await ResourceController.findMany(resource.filter, resource.constraints, ctx);
     *     } catch (ex) {
     *         switch (ex.message) {
     *             // Be sure to throw a SCIM 404 error if the specific resource wasn't found...
     *             case "Not Found":
     *                 throw new SCIMMY.Types.Error(404, null, `Resource ${resource.id} not found`);
     *             // ...and also rethrow any other exceptions as SCIM 500 errors
     *             default:
     *                 throw new SCIMMY.Types.Error(500, null, ex.message);
     *         }
     *     }
     * }
     */
    
    /**
     * Egress handler method storage property
     * @type {SCIMMY.Types.Resource~EgressHandler}
     * @private
     * @abstract
     */
    static #egress;
    /**
     * Sets the method to be called to retrieve a resource on read
     * @template {typeof SCIMMY.Types.Resource<any>} R
     * @template {SCIMMY.Types.Schema} S
     * @typeParam {S} [V=S]
     * @param {SCIMMY.Types.Resource~EgressHandler<InstanceType<R>, V>} handler - function to invoke to retrieve a resource on read
     * @returns {R} this resource type class for chaining
     * @abstract
     */
    static egress(handler) {
        throw new TypeError(`Method 'egress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Handler for degress of a resource
     * @template {SCIMMY.Types.Resource<any>} R - type of resource instance performing degress
     * @callback SCIMMY.Types.Resource~DegressHandler
     * @param {R} resource - the resource performing the degress
     * @param {*} [ctx] - external context in which the handler has been called
     * @returns {void|Promise<void>}
     * @example
     * // Handle a request to delete a specific resource
     * async function degress(resource, ctx) {
     *     try {
     *         // Call some external controller to delete the resource from your database
     *         await ResourceController.delete(resource.id, ctx);
     *     } catch (ex) {
     *         switch (ex.message) {
     *             // Be sure to throw a SCIM 404 error if the specific resource wasn't found...
     *             case "Not Found":
     *                 throw new SCIMMY.Types.Error(404, null, `Resource ${resource.id} not found`);
     *             // ...and also rethrow any other exceptions as SCIM 500 errors
     *             default:
     *                 throw new SCIMMY.Types.Error(500, null, ex.message);
     *         }
     *     }
     * }
     */
    
    /**
     * Degress handler method storage property
     * @type {SCIMMY.Types.Resource~DegressHandler}
     * @private
     * @abstract
     */
    static #degress;
    /**
     * Sets the method to be called to dispose of a resource on delete
     * @template {typeof SCIMMY.Types.Resource<any>} R
     * @param {SCIMMY.Types.Resource~DegressHandler<InstanceType<R>>} handler - function to invoke to dispose of a resource on delete
     * @returns {R} this resource type class for chaining
     * @abstract
     */
    static degress(handler) {
        throw new TypeError(`Method 'degress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Describe this resource type implementation
     * @returns {SCIMMY.Types.Resource~ResourceDescription} object describing the resource type implementation 
     */
    static describe() {
        // Find all schema definitions that extend this resource's definition...
        const findSchemaDefinitions = (d) => d.attributes.filter(a => a instanceof SchemaDefinition)
            .map(e => ([e, ...findSchemaDefinitions(e)])).flat(Infinity);
        // ...so they can be included in the returned description
        const schemaExtensions = [...new Set(findSchemaDefinitions(this.schema.definition))]
            .map(({id: schema, required}) => ({schema, required}));
        
        /**
         * An object describing a resource type's implementation
         * @typedef {Object} SCIMMY.Types.Resource~ResourceDescription
         * @property {String} id - URN namespace of the resource's SCIM schema definition
         * @property {String} name - friendly name of the resource's SCIM schema definition
         * @property {String} endpoint - resource type's endpoint, relative to a service provider's base URL
         * @property {String} description - human-readable description of the resource
         * @property {Object[]} [schemaExtensions] - schema extensions that augment the resource
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
     * Instantiate a new SCIM resource with supplied configuration
     * @overload
     * @param {Object} config - the parameters of the resource instance request
     * @param {String} [config.filter] - the filter to be applied on ingress/egress by implementing resource
     * @param {String} [config.excludedAttributes] - the comma-separated string list of attributes or filters to exclude on egress
     * @param {String} [config.attributes] - the comma-separated string list of attributes or filters to include on egress
     * @param {String} [config.sortBy] - the attribute retrieved resources should be sorted by
     * @param {String} [config.sortOrder] - the direction retrieved resources should be sorted in
     * @param {Number} [config.startIndex] - offset index that retrieved resources should start from
     * @param {Number} [config.count] - maximum number of retrieved resources that should be returned in one operation
     */
    /**
     * Instantiate a new SCIM resource and parse any supplied parameters
     * @param {String} [id] - the ID of the requested resource
     * @param {Object} [config] - the parameters of the resource instance request
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
     * @property {SCIMMY.Messages.ListResponse~ListConstraints} [constraints] - sort and pagination properties parsed from the supplied config
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
                ...(!Number.isNaN(Number(startIndex)) && Number.isInteger(startIndex) ? {startIndex: Math.max(startIndex, 1)} : {}),
                ...(!Number.isNaN(Number(count)) && Number.isInteger(count) ? {count: Math.max(count, 0)} : {})
            };
        }
    }
    
    /**
     * Calls resource's egress method for data retrieval.
     * Wraps the results in valid SCIM list response or single resource syntax.
     * @template [T=*] - external context object passed to ingress handler
     * @param {T} [ctx] - any additional context information to pass to the egress handler
     * @returns {SCIMMY.Messages.ListResponse|S} the specifically requested resource instance, if an ID was supplied to resource constructor, or collection of resources matching instance's configured filter.
     * @abstract
     */
    async read(ctx) {
        throw new TypeError(`Method 'read' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Calls resource's ingress method for consumption after unwrapping the SCIM resource
     * @template [T=*] - external context object passed to ingress handler
     * @param {Object} instance - the raw resource type instance for consumption by ingress method
     * @param {T} [ctx] - any additional context information to pass to the ingress handler
     * @returns {S} the consumed resource type instance
     * @abstract
     */
    async write(instance, ctx) {
        throw new TypeError(`Method 'write' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Retrieves resources via egress method, and applies specified patch operations.
     * Emits patched resources for consumption with resource's ingress method.
     * @template [T=*] - external context object passed to ingress handler
     * @param {Object} message - the PatchOp message to apply to the received resource
     * @param {typeof SCIMMY.Messages.PatchOp.id[]} message.schemas - list exclusively containing SCIM PatchOp message schema ID
     * @param {SCIMMY.Messages.PatchOp~PatchOpOperation[]} message.Operations - PatchOp operations to be applied
     * @param {T} [ctx] - any additional context information to pass to the ingress/egress handlers
     * @returns {S} the resource type instance after patching and consumption by ingress method
     * @abstract
     */
    async patch(message, ctx) {
        throw new TypeError(`Method 'patch' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Calls resource's degress method for disposal of the SCIM resource
     * @template [T=*] - external context object passed to ingress handler
     * @param {T} [ctx] - any additional context information to pass to the degress handler
     * @abstract
     */
    async dispose(ctx) {
        throw new TypeError(`Method 'dispose' not implemented by resource '${this.constructor.name}'`);
    }
}