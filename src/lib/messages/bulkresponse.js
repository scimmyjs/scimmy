/**
 * SCIM Bulk Response Message Type
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
     * Instantiate a new SCIM BulkResponse message from the supplied Operations
     * @param {Object|Object[]} request - contents of the BulkResponse if object, or results of performed operations if array
     * @param {Object[]} [request.Operations] - list of applied SCIM-compliant bulk operation results, if request is an object
     * @property {Object[]} Operations - list of BulkResponse operation results
     */
    constructor(request) {
        let outbound = Array.isArray(request),
            operations = (outbound ? request : request?.Operations ?? []);
        
        // Verify the BulkResponse contents are valid
        if (!outbound && Array.isArray(request.schemas) && (!request.schemas.includes(BulkResponse.#id) || request.schemas.length > 1))
            throw new TypeError(`BulkResponse request body messages must exclusively specify schema as '${BulkResponse.#id}'`);
        if (!Array.isArray(operations))
            throw new TypeError("Expected 'Operations' property of 'request' parameter to be an array in BulkResponse constructor");
        
        // All seems ok, prepare the BulkResponse
        this.schemas = [BulkResponse.#id];
        this.Operations = [...operations];
    }
}