/**
 * SCIM Bulk Response Message
 * @alias SCIMMY.Messages.BulkResponse
 * @since 1.0.0
 * @summary
 * *   Encapsulates bulk operation results as [BulkResponse messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.7) for consumption by a client.
 * *   Provides a method to unwrap BulkResponse results into operation success status, and map newly created resource IDs to their BulkRequest bulkIds.
 */
export class BulkResponse {
    /**
     * SCIM BulkResponse Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:BulkResponse";
    
    /**
     * BulkResponse operation response status codes
     * @enum {200|201|204|307|308|400|401|403|404|409|412|500|501} SCIMMY.Messages.BulkResponse~ResponseStatusCodes
     * @inner
     */
    
    /**
     * BulkResponse operation details for a given BulkRequest operation
     * @typedef {Object} SCIMMY.Messages.BulkResponse~BulkOpResponse
     * @property {String} [location] - canonical URI for the target resource of the operation
     * @property {SCIMMY.Messages.BulkRequest~ValidBulkMethods} method - the HTTP method used for the requested operation
     * @property {String} [bulkId] - the transient identifier of a newly created resource, unique within a bulk request and created by the client
     * @property {String} [version] - resource version after operation has been applied
     * @property {SCIMMY.Messages.BulkResponse~ResponseStatusCodes} status - the HTTP response status code for the requested operation
     * @property {Object} [response] - the HTTP response body for the specified request operation
     * @inner
     */
    
    /**
     * Instantiate a new outbound SCIM BulkResponse message from the results of performed operations
     * @overload
     * @param {SCIMMY.Messages.BulkResponse~BulkOpResponse[]} operations - results of performed operations
     */
    /**
     * Instantiate a new inbound SCIM BulkResponse message instance from the received response
     * @overload
     * @param {Object} request - contents of the received BulkResponse message
     * @param {SCIMMY.Messages.BulkResponse~BulkOpResponse[]} request.Operations - list of SCIM-compliant bulk operation results
     */
    /**
     * Instantiate a new SCIM BulkResponse message from the supplied Operations
     * @param {SCIMMY.Messages.BulkResponse~BulkOpResponse[]} request - results of performed operations if array
     * @param {Object} request - contents of the received BulkResponse message if object
     * @param {SCIMMY.Messages.BulkResponse~BulkOpResponse[]} request.Operations - list of SCIM-compliant bulk operation results
     * @property {SCIMMY.Messages.BulkResponse~BulkOpResponse[]} Operations - list of BulkResponse operation results
     */
    constructor(request = []) {
        const outbound = Array.isArray(request);
        const operations = (outbound ? request : request?.Operations ?? []);
        
        // Verify the BulkResponse contents are valid
        if (!outbound && Array.isArray(request?.schemas) && (!request.schemas.includes(BulkResponse.#id) || request.schemas.length > 1))
            throw new TypeError(`BulkResponse request body messages must exclusively specify schema as '${BulkResponse.#id}'`);
        if (!Array.isArray(operations))
            throw new TypeError("BulkResponse constructor expected 'Operations' property of 'request' parameter to be an array");
        if (!outbound && !operations.length)
            throw new TypeError("BulkResponse request body must contain 'Operations' attribute with at least one operation");
        
        // All seems OK, prepare the BulkResponse
        this.schemas = [BulkResponse.#id];
        this.Operations = [...operations];
    }
    
    /**
     * Resolve bulkIds of POST operations into new resource IDs  
     * @returns {Map<String, String|Boolean>} map of bulkIds to resource IDs if operation was successful, or false if not
     */
    resolve() {
        return new Map(this.Operations
            // Only target POST operations with valid bulkIds
            .filter(o => o.method === "POST" && !!o.bulkId && typeof o.bulkId === "string")
            .map(o => ([o.bulkId, (typeof o.location === "string" && !!o.location ? o.location.split("/").pop() : false)])));
    }
}