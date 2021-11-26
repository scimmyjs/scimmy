import {ListResponse} from "./listresponse.js";
import Types from "../types.js";
import Resources from "../resources.js";

/**
 * SCIM Search Request Message Type
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
     * @param {Object} request - contents of the SearchRequest received by the service provider
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
        let {schemas = [], filter, excludedAttributes = [], attributes = [], sortBy, sortOrder, startIndex, count} = request ?? {};
        
        // Verify the BulkResponse contents are valid
        if (Array.isArray(schemas) && ((schemas.length === 1 && !schemas.includes(SearchRequest.#id) || schemas.length > 1)))
            throw new TypeError(`SearchRequest request body messages must exclusively specify schema as '${SearchRequest.#id}'`);
        // Bail out if filter isn't a non-empty string
        if (filter !== undefined && (typeof filter !== "string" || !filter.trim().length))
            throw new Types.Error(400, "invalidFilter", "Expected filter to be a non-empty string");
        // Bail out if excludedAttributes isn't an array of non-empty strings
        if (!Array.isArray(excludedAttributes) || !excludedAttributes.every((a) => (typeof a === "string" && !!a.trim().length)))
            throw new Types.Error(400, "invalidFilter", "Expected excludedAttributes to be an array of non-empty strings");
        // Bail out if attributes isn't an array of non-empty strings
        if (!Array.isArray(attributes) || !attributes.every((a) => (typeof a === "string" && !!a.trim().length)))
            throw new Types.Error(400, "invalidFilter", "Expected attributes to be an array of non-empty strings");
        
        // All seems ok, prepare the SearchRequest
        this.schemas = [SearchRequest.#id];
        if (!!filter) this.filter = filter;
        if (excludedAttributes.length) this.excludedAttributes = [...excludedAttributes];
        if (attributes.length) this.attributes = [...attributes];
        if (sortBy !== undefined) this.sortBy = sortBy;
        if (["ascending", "descending"].includes(sortOrder)) this.sortOrder = sortOrder;
        if (startIndex !== undefined) this.startIndex = startIndex;
        if (count !== undefined) this.count = count;
    }
    
    /**
     * Apply a search request operation, retrieving results from specified resource types
     * @param {SCIMMY.Types.Resource[]} [resourceTypes] - resource type classes to be used while processing the search request, defaults to declared resources
     * @returns {SCIMMY.Messages.ListResponse} a ListResponse message with results of the search request 
     */
    async apply(resourceTypes = Object.values(Resources.declared())) {
        // Make sure all specified resource types extend the Resource type class so operations can be processed correctly 
        if (!Array.isArray(resourceTypes) || !resourceTypes.every(r => r.prototype instanceof Types.Resource))
            throw new TypeError("Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of SearchRequest");
        
        // Build the common request template
        let request = {
            ...(!!this.filter ? {filter: this.filter} : {}),
            ...(!!this.excludedAttributes ? {excludedAttributes: this.excludedAttributes.join(",")} : {}),
            ...(!!this.attributes ? {attributes: this.attributes.join(",")} : {})
        }
        
        // If only one resource type, just read from it
        if (resourceTypes.length === 1) {
            let [Resource] = resourceTypes;
            return new Resource({...this, ...request}).read();
        }
        // Otherwise, read from all resources and return collected results
        else {
            // Read from, and unwrap results for, supplied resource types
            let results = await Promise.all(resourceTypes.map((Resource) => new Resource(request).read()))
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