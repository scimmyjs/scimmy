import Types from "../types.js";

/**
 * List of valid HTTP methods in a SCIM bulk request operation
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidBulkMethods
 * @memberOf SCIMMY.Messages.BulkOp
 * @default
 */
const validMethods = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * SCIM Bulk Request and Response Message Type
 * @alias SCIMMY.Messages.BulkOp
 * @summary
 * *   Parses [BulkRequest messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.7), making sure "Operations" have been specified, and conform with the SCIM protocol.
 * *   Provides a method to apply BulkRequest operations and return the results as a BulkResponse.
 */
export class BulkOp {
    /**
     * SCIM Bulk Request Message Schema ID
     * @type {String}
     * @private
     */
    static #requestId = "urn:ietf:params:scim:api:messages:2.0:BulkRequest";
    /**
     * SCIM Bulk Response Message Schema ID
     * @type {String}
     * @private
     */
    static #responseId = "urn:ietf:params:scim:api:messages:2.0:BulkResponse";
    
    /**
     * Number of errors to accept before the operation is terminated and an error response is returned
     * @type {Number}
     * @private
     */
    #errorLimit;
    
    /**
     * Current number of errors encountered when applying operations in a BulkRequest
     * @type {Number}
     * @private
     */
    #errorCount = 0;
    
    /**
     * Operations to perform specified by the BulkRequest
     * @type {Object[]}
     * @private
     */
    #bulkOperations;
    
    /**
     * Instantiate a new SCIM BulkResponse message from the supplied BulkRequest    
     * @param {Object} request - contents of the BulkRequest operation being performed
     * @property {Object[]} Operations - list of SCIM-compliant bulk operations to apply
     */
    constructor(request) {
        let {schemas = [], Operations: operations = [], failOnErrors = 0} = request ?? {};
        
        // Make sure specified schema is valid
        if (schemas.length !== 1 || !schemas.includes(BulkOp.#requestId))
            throw new Types.Error(400, "invalidSyntax", `BulkRequest request body messages must exclusively specify schema as '${BulkOp.#requestId}'`);
        
        // Make sure failOnErrors is a valid integer
        if (typeof failOnErrors !== "number" || !Number.isInteger(failOnErrors) || failOnErrors < 0)
            throw new Types.Error(400, "invalidSyntax", `BulkRequest expected 'failOnErrors' attribute of 'request' parameter to be a positive integer`);
        
        // Make sure request body contains valid operations to perform
        if (!Array.isArray(operations))
            throw new Types.Error(400, "invalidValue", "BulkRequest expected 'Operations' attribute of 'request' parameter to be an array");
        if (!operations.length)
            throw new Types.Error(400, "invalidValue", "BulkRequest request body must contain 'Operations' attribute with at least one operation");
        
        // All seems ok, prepare the BulkResponse
        this.schemas = [BulkOp.#responseId];
        this.Operations = [];
        
        // Store details of BulkRequest to be applied
        this.#errorLimit = failOnErrors;
        this.#operations = operations;
    }
}