import {ListResponse} from "./listresponse.js";
import Types from "../types.js";
import Resources from "../resources.js";

/**
 * SCIM Search Request Message
 * @alias SCIMMY.Messages.SearchRequest
 * @since 1.0.0
 * @summary
 * *   Encapsulates HTTP POST data as [SCIM SearchRequest messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.3).
 * *   Provides a method to perform the search request against the declared or specified resource types.
 */
export class SearchRequest {
    /**
     * SCIM SearchRequest Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:SearchRequest";
    
    /**
     * Instantiate a new SCIM SearchRequest message from the supplied request
     * @param {Object} [request] - contents of the SearchRequest received by the service provider
     * @param {String} [request.filter] - the filter to be applied on ingress/egress by implementing resource
     * @param {String[]} [request.excludedAttributes] - the string list of attributes or filters to exclude on egress
     * @param {String[]} [request.attributes] - the string list of attributes or filters to include on egress
     * @param {String} [request.sortBy] - the attribute retrieved resources should be sorted by
     * @param {String} [request.sortOrder] - the direction retrieved resources should be sorted in
     * @param {Number} [request.startIndex] - offset index that retrieved resources should start from
     * @param {Number} [request.count] - maximum number of retrieved resources that should be returned in one operation
     * @property {String} [filter] - the filter to be applied on ingress/egress by implementing resource
     * @property {String[]} [excludedAttributes] - the string list of attributes or filters to exclude on egress
     * @property {String[]} [attributes] - the string list of attributes or filters to include on egress
     * @property {String} [sortBy] - the attribute retrieved resources should be sorted by
     * @property {String} [sortOrder] - the direction retrieved resources should be sorted in
     * @property {Number} [startIndex] - offset index that retrieved resources should start from
     * @property {Number} [count] - maximum number of retrieved resources that should be returned in one operation
     */
    constructor(request) {
        const {schemas} = request ?? {};
        
        // Verify the SearchRequest contents are valid
        if (request !== undefined && (!Array.isArray(schemas) || ((schemas.length === 1 && !schemas.includes(SearchRequest.#id)) || schemas.length > 1)))
            throw new Types.Error(400, "invalidSyntax", `SearchRequest request body messages must exclusively specify schema as '${SearchRequest.#id}'`);
        
        try {
            // All seems OK, prepare the SearchRequest
            this.schemas = [SearchRequest.#id];
            this.prepare(request);
        } catch (ex) {
            // Rethrow TypeErrors from prepare as SCIM Errors
            throw new Types.Error(400, "invalidValue", ex.message.replace(" in 'prepare' method of SearchRequest", ""));
        }
    }
    
    /**
     * Prepare a new search request for transmission to a service provider
     * @param {Object} [params] - details of the search request to be sent to a service provider
     * @param {String} [params.filter] - the filter to be applied on ingress/egress by implementing resource
     * @param {String[]} [params.excludedAttributes] - the string list of attributes or filters to exclude on egress
     * @param {String[]} [params.attributes] - the string list of attributes or filters to include on egress
     * @param {String} [params.sortBy] - the attribute retrieved resources should be sorted by
     * @param {String} [params.sortOrder] - the direction retrieved resources should be sorted in
     * @param {Number} [params.startIndex] - offset index that retrieved resources should start from
     * @param {Number} [params.count] - maximum number of retrieved resources that should be returned in one operation
     * @returns {SCIMMY.Messages.SearchRequest} this SearchRequest instance for chaining
     */
    prepare(params = {}) {
        const {filter, excludedAttributes = [], attributes = [], sortBy, sortOrder, startIndex, count} = params;
        
        // Make sure filter is a non-empty string, if specified
        if (filter !== undefined && (typeof filter !== "string" || !filter.trim().length))
            throw new TypeError("Expected 'filter' parameter to be a non-empty string in 'prepare' method of SearchRequest");
        // Make sure excludedAttributes is an array of non-empty strings
        if (!Array.isArray(excludedAttributes) || !excludedAttributes.every((a) => (typeof a === "string" && !!a.trim().length)))
            throw new TypeError("Expected 'excludedAttributes' parameter to be an array of non-empty strings in 'prepare' method of SearchRequest");
        // Make sure attributes is an array of non-empty strings
        if (!Array.isArray(attributes) || !attributes.every((a) => (typeof a === "string" && !!a.trim().length)))
            throw new TypeError("Expected 'attributes' parameter to be an array of non-empty strings in 'prepare' method of SearchRequest");
        // Make sure sortBy is a non-empty string, if specified
        if (sortBy !== undefined && (typeof sortBy !== "string" || !sortBy.trim().length))
            throw new TypeError("Expected 'sortBy' parameter to be a non-empty string in 'prepare' method of SearchRequest");
        // Make sure sortOrder is a non-empty string, if specified
        if (sortOrder !== undefined && !["ascending", "descending"].includes(sortOrder))
            throw new TypeError("Expected 'sortOrder' parameter to be either 'ascending' or 'descending' in 'prepare' method of SearchRequest");
        // Make sure startIndex is a positive integer, if specified
        if (startIndex !== undefined && (typeof startIndex !== "number" || !Number.isInteger(startIndex) || startIndex < 1))
            throw new TypeError("Expected 'startIndex' parameter to be a positive integer in 'prepare' method of SearchRequest");
        // Make sure count is a positive integer, if specified
        if (count !== undefined && (typeof count !== "number" || !Number.isInteger(count) || count < 1))
            throw new TypeError("Expected 'count' parameter to be a positive integer in 'prepare' method of SearchRequest");
        
        // Sanity checks have passed, assign values
        if (!!filter) this.filter = filter;
        if (excludedAttributes.length) this.excludedAttributes = [...excludedAttributes];
        if (attributes.length) this.attributes = [...attributes];
        if (sortBy !== undefined) this.sortBy = sortBy;
        if (["ascending", "descending"].includes(sortOrder)) this.sortOrder = sortOrder;
        if (startIndex !== undefined) this.startIndex = startIndex;
        if (count !== undefined) this.count = count;
        
        return this;
    }
    
    /**
     * Apply a search request operation, retrieving results from specified resource types
     * @param {typeof SCIMMY.Types.Resource[]} [resourceTypes] - resource type classes to be used while processing the search request, defaults to declared resources
     * @param {*} [ctx] - any additional context information to pass to the egress handler
     * @returns {SCIMMY.Messages.ListResponse} a ListResponse message with results of the search request 
     */
    async apply(resourceTypes = Object.values(Resources.declared()), ctx) {
        // Make sure all specified resource types extend the Resource type class so operations can be processed correctly 
        if (!Array.isArray(resourceTypes) || !resourceTypes.every(r => r.prototype instanceof Types.Resource))
            throw new TypeError("Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of SearchRequest");
        
        // Build the common request template
        const request = {
            ...(!!this.filter ? {filter: this.filter} : {}),
            ...(!!this.excludedAttributes ? {excludedAttributes: this.excludedAttributes.join(",")} : {}),
            ...(!!this.attributes ? {attributes: this.attributes.join(",")} : {})
        }
        
        // If only one resource type, just read from it
        if (resourceTypes.length === 1) {
            const [Resource] = resourceTypes;
            return new Resource({...this, ...request}).read(ctx);
        }
        // Otherwise, read from all resources and return collected results
        else {
            // Read from, and unwrap results for, supplied resource types
            const results = await Promise.all(resourceTypes.map((Resource) => new Resource(request).read(ctx)))
                .then((r) => r.map((l) => l.Resources));
            
            // Collect the results in a list response with specified constraints
            return new ListResponse(results.flat(Infinity), {
                sortBy: this.sortBy, sortOrder: this.sortOrder,
                ...(!!this.startIndex ? {startIndex: Number(this.startIndex)} : {}),
                ...(!!this.count ? {itemsPerPage: Number(this.count)} : {})
            });
        }
    }
}