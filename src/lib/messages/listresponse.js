/**
 * SCIM List Response Message
 * @alias SCIMMY.Messages.ListResponse
 * @template {SCIMMY.Types.Schema} [T=*] - type of schema instance that will be passed to handlers
 * @summary
 * *   Formats supplied service provider resources as [ListResponse messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2), handling pagination and sort when required.
 * @description
 * The `ListResponse` class creates a SCIM [ListResponse message](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2) for a supplied set of resources, and automates pagination and sorting of the included set.
 * It is used internally by the `read()` method in each of {@link SCIMMY.Resources|SCIMMY's Resource classes} when requesting a list of resources matching a given query,
 * and in the {@link SCIMMY.Messages.SearchRequest#apply|`apply()`} instance method of the {@link SCIMMY.Messages.SearchRequest|SearchRequest} message class.
 * 
 * > **Tip:**  
 * > When using the {@link SCIMMY.Resources.User|`User`} and {@link SCIMMY.Resources.Group|`Group`} resource classes, their instance `read()` methods will wrap the set of matching query results in a `ListResponse` instance.
 * > This happens automatically when retrieving multiple resources, meaning their {@link SCIMMY.Types.Resource~EgressHandler|egress handlers} need only return the array of matching resources, not a `ListResponse` instance of their own.
 * 
 * @example <caption>Basic usage with no constraints</caption>
 * // Retrieve the list of resources from somewhere, and pass it to the ListResponse constructor
 * const resources = [{id: "1", userName: "AdeleV"}, {id: "2", userName: "GradyA"}];
 * const response = new SCIMMY.Messages.ListResponse(resources);
 * 
 * @example <caption>Basic usage with specified total results</caption>
 * // Retrieve the list of resources from somewhere...
 * const resources = [{id: "1", userName: "AdeleV"}, {id: "2", userName: "GradyA"}];
 * // ...and separately retrieve the total number of matching results
 * const totalResults = 1005;
 * 
 * // Instantiate the list response with the resources array, specifying totalResults
 * const response = new SCIMMY.Messages.ListResponse(resources, {totalResults});
 * 
 * @example <caption>Advanced usage with manipulation of array length</caption>
 * // Retrieve the list of resources from somewhere...
 * const resources = [{id: "1", userName: "AdeleV"}, {id: "2", userName: "GradyA"}];
 * // ...and set the length of the list to match the desired total
 * resources.length = 1005;
 * 
 * // Instantiate the list response with the (mostly) sparse resources array
 * const response = new SCIMMY.Messages.ListResponse(resources, {itemsPerPage: 2});
 */
export class ListResponse {
    /** @private */
    static #id = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
    
    /**
     * SCIM List Response Message Schema ID
     * @type {"urn:ietf:params:scim:api:messages:2.0:ListResponse"}
     */
    static get id() {
        return this.#id;
    }
    
    /**
     * ListResponse sort and pagination constraints
     * @typedef {Object} SCIMMY.Messages.ListResponse~ListConstraints
     * @property {String} [sortBy] - the attribute to sort results by, if any
     * @property {String} [sortOrder="ascending"] - the direction to sort results in, if sortBy is specified
     * @property {Number} [startIndex=1] - offset index that items start from
     * @property {Number} [count=20] - maximum number of items returned in this list response
     */
    
    /**
     * Instantiate a new SCIM List Response Message with relevant details
     * @param {SCIMMY.Messages.ListResponse<T>|T[]} request - contents of the ListResponse message, or items to include in the list response
     * @param {SCIMMY.Messages.ListResponse~ListConstraints} [params] - parameters for the list response (i.e. sort details, start index, and items per page)
     * @param {String} [params.sortBy] - the attribute to sort results by, if any
     * @param {String} [params.sortOrder="ascending"] - the direction to sort results in, if sortBy is specified
     * @param {Number} [params.startIndex=1] - offset index that items start from
     * @param {Number} [params.count=20] - alias property for itemsPerPage, used only if itemsPerPage is unset
     * @param {Number} [params.itemsPerPage=20] - maximum number of items returned in this list response
     * @param {Number} [params.totalResults] - the total number of resources matching a given request
     * @property {[typeof SCIMMY.Messages.ListResponse.id]} schemas - list exclusively containing the SCIM ListResponse message schema ID
     * @property {Array<T>} Resources - resources included in the list response
     * @property {Number} totalResults - the total number of resources matching a given request
     * @property {Number} startIndex - index within total results that included resources start from
     * @property {Number} itemsPerPage - maximum number of items returned in this list response
     */
    constructor(request = [], params = {}) {
        const outbound = Array.isArray(request);
        const resources = (outbound ? request : request?.Resources ?? []);
        const totalResults = (outbound ? params.totalResults ?? resources.length : request.totalResults);
        const {sortBy, sortOrder = "ascending"} = (outbound ? params : {});
        const {startIndex = 1, count = 20, itemsPerPage = count} = (outbound ? params : request);
        
        // Verify the ListResponse contents are valid
        if (!outbound && Array.isArray(request.schemas) && (!request.schemas.includes(ListResponse.#id) || request.schemas.length > 1))
            throw new TypeError(`ListResponse request body messages must exclusively specify schema as '${ListResponse.#id}'`);
        if (sortBy !== undefined && typeof sortBy !== "string")
            throw new TypeError("Expected 'sortBy' parameter to be a string in ListResponse message constructor");
        if (sortBy !== undefined && !["ascending", "descending"].includes(sortOrder))
            throw new TypeError("Expected 'sortOrder' parameter to be either 'ascending' or 'descending' in ListResponse message constructor");
        
        // Check supplied itemsPerPage and startIndex are valid integers...
        for (let [key, val, min] of Object.entries({totalResults, itemsPerPage, startIndex}).map(([key, val], index) => ([key, val, Math.max(index - 1, 0)]))) {
            // ...but only expect actual number primitives when preparing an outbound list response
            if (Number.isNaN(Number.parseInt(val)) || !`${val}`.match(/^-?\d*$/) || (outbound && (typeof val !== "number" || !Number.isInteger(val)))) {
                throw new TypeError(`Expected '${key}' parameter to be a ${min ? "positive" : "non-negative"} integer in ListResponse message constructor`);
            }
        }
        
        // Construct the ListResponse message
        this.schemas = [ListResponse.#id];
        this.Resources = resources.filter(r => r);
        // Constrain integer properties to their minimum values
        this.startIndex = Math.max(Number.parseInt(startIndex), 1);
        this.itemsPerPage = Math.max(Number.parseInt(itemsPerPage), 0);
        this.totalResults = Math.max(totalResults, 0);
        
        // Handle sorting if sortBy is defined
        if (sortBy !== undefined) {
            const paths = sortBy.split(".");
            
            // Do the sort!
            this.Resources = this.Resources.sort((a, b) => {
                // Resolve target sort values for each side of the comparison (either the "primary" entry, or first entry, in a multi-valued attribute, or the target value)
                const reducer = (res = {}, path = "") => ((!Array.isArray(res[path]) ? res[path] : (res[path].find(v => !!v.primary) ?? res[path][0])?.value ?? res[path][0]));
                const ta = paths.reduce(reducer, a);
                const tb = paths.reduce(reducer, b);
                const list = [ta, tb];
                
                // If some or all of the targets are unspecified, sort specified value above unspecified value
                if (list.some(t => ((t ?? undefined) === undefined)))
                    return ((ta ?? undefined) === (tb ?? undefined) ? 0 : (ta ?? undefined) === undefined ? 1 : -1);
                // If all the targets are numbers, sort by the bigger number
                if (list.every(t => (typeof t === "number" && !Number.isNaN(Number(t)))))
                    return ta - tb;
                // If all the targets are dates, sort by the later date
                if (list.every(t => (String(t instanceof Date ? t.toISOString() : t)
                    .match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?$/))))
                    return new Date(ta) - new Date(tb);
                
                // If all else fails, compare the targets by string values
                return (String(ta).localeCompare(String(tb)));
            });
            
            // Reverse the order on descending
            if (sortOrder === "descending") this.Resources.reverse();
        }
        
        // If startIndex is within results, offset results to startIndex
        if ((this.Resources.length >= this.startIndex) && (this.totalResults !== this.Resources.length + this.startIndex - 1)) {
            this.Resources = this.Resources.slice(this.startIndex-1);
        }
        
        // If there are more resources than items per page, paginate the resources
        if (this.Resources.length > this.itemsPerPage) {
            this.Resources.length = this.itemsPerPage;
        }
    }
}