import Types from "../types.js";
import Resources from "../resources.js";
import {Error as ErrorMessage} from "./error.js";

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
     * @param {Object[]} request.Operations - list of SCIM-compliant bulk operations to apply
     * @param {Number} [maxOperations] - maximum number of operations supported in the request
     * @property {Object[]} Operations - list of BulkResponse operation results
     */
    constructor(request, maxOperations = 0) {
        let {schemas = [], Operations: operations = [], failOnErrors = 0} = request ?? {};
        
        // Make sure specified schema is valid
        if (schemas.length !== 1 || !schemas.includes(BulkOp.#requestId))
            throw new Types.Error(400, "invalidSyntax", `BulkRequest request body messages must exclusively specify schema as '${BulkOp.#requestId}'`);
        
        // Make sure failOnErrors is a valid integer
        if (typeof failOnErrors !== "number" || !Number.isInteger(failOnErrors) || failOnErrors < 0)
            throw new Types.Error(400, "invalidSyntax", "BulkRequest expected 'failOnErrors' attribute of 'request' parameter to be a positive integer");
        // Make sure maxOperations is a valid integer
        if (typeof maxOperations !== "number" || !Number.isInteger(maxOperations) || maxOperations < 0)
            throw new Types.Error(400, "invalidSyntax", "BulkRequest expected 'maxOperations' parameter to be a positive integer");
        
        // Make sure request body contains valid operations to perform
        if (!Array.isArray(operations))
            throw new Types.Error(400, "invalidValue", "BulkRequest expected 'Operations' attribute of 'request' parameter to be an array");
        if (!operations.length)
            throw new Types.Error(400, "invalidValue", "BulkRequest request body must contain 'Operations' attribute with at least one operation");
        if (maxOperations > 0 && operations.length > maxOperations)
            throw new Types.Error(413, null, `Number of operations in BulkRequest exceeds maxOperations limit (${maxOperations})`);
        
        // All seems ok, prepare the BulkResponse
        this.schemas = [BulkOp.#responseId];
        this.Operations = [];
        
        // Store details of BulkRequest to be applied
        this.#errorLimit = failOnErrors;
        this.#bulkOperations = operations;
    }
    
    /**
     * Apply the operations specified by the supplied BulkRequest 
     * @param {SCIMMY.Types.Resource[]|*} [resourceTypes] - resource type classes to be used while processing bulk operations
     * @return {SCIMMY.Messages.BulkOp} this BulkOp instance for chaining
     */
    async apply(resourceTypes = Object.values(Resources.declared())) {
        // Make sure all specified resource types extend the Resource type class so operations can be processed correctly 
        if (!resourceTypes.every(r => r.prototype instanceof Types.Resource))
            throw new TypeError("Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of BulkOp");
        
        // Set up easy access to resource types by endpoint, and bulkId to real ID map
        let typeMap = new Map(resourceTypes.map((r) => [r.endpoint, r])),
            bulkIds = new Map();
        
        for (let op of this.#bulkOperations) {
            if (!this.#errorLimit || this.#errorCount < this.#errorLimit) {
                let {method, bulkId, path = "", data} = op,
                    index = this.#bulkOperations.indexOf(op) + 1,
                    errorSuffix = `in BulkRequest operation #${index}`,
                    [endpoint, id] = path.substring(1).split("/"),
                    TargetResource = (endpoint ? typeMap.get(`/${endpoint}`) : false),
                    location = (TargetResource ? [TargetResource.basepath() ?? TargetResource.endpoint, id].filter(v => v).join("/") : path),
                    result = {method: method, bulkId: bulkId, location: location},
                    error = false;
                
                // Preemptively add the result to the stack
                this.Operations.push(result);
                
                // Make sure method has a value
                if (!method && method !== false)
                    error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Missing or empty 'method' string ${errorSuffix}`));
                // Make sure that value is a string
                else if (typeof method !== "string")
                    error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Expected 'method' to be a string ${errorSuffix}`));
                // Make sure that string is a valid method
                else if (!validMethods.includes(String(method).toUpperCase()))
                    error = new ErrorMessage(new Types.Error(400, "invalidValue", `Invalid 'method' value '${method}' ${errorSuffix}`));
                // Make sure path has a value
                else if (!path && path !== false)
                    error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Missing or empty 'path' string ${errorSuffix}`));
                // Make sure that path is a string
                else if (typeof path !== "string")
                    error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Expected 'path' to be a string ${errorSuffix}`));
                // Make sure that string points to a valid resource type
                else if (![...typeMap.keys()].some(e => path.startsWith(e)))
                    error = new ErrorMessage(new Types.Error(400, "invalidValue", `Invalid 'path' value '${path}' ${errorSuffix}`));
                // Make sure there ISN'T a resource targeted if the request type is POST
                else if (method.toUpperCase() === "POST" && !!id)
                    error = new ErrorMessage(new Types.Error(404, null, "POST operation must not target a specific resource"));
                // Make sure there IS a resource targeted if the request type isn't POST
                else if (method.toUpperCase() !== "POST" && !id)
                    error = new ErrorMessage(new Types.Error(404, null, `${method.toUpperCase()} operation must target a specific resource`));
                // Make sure data is an object, if method isn't DELETE
                else if (method.toUpperCase() !== "DELETE" && (Object(data) !== data || Array.isArray(data)))
                    error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Expected 'data' to be a single complex value ${errorSuffix}`))
                // If things look OK, attempt to apply the operation
                else {
                    try {
                        let resource = new TargetResource(id),
                            value;
                        
                        switch (method.toUpperCase()) {
                            case "POST":
                            case "PUT":
                                value = await resource.write(data);
                                if (bulkId && value.id) bulkIds.set(bulkId, value.id);
                                Object.assign(result, {status: (!!id ? "200" : "201"), location: value?.meta?.location});
                                break;
                                
                            case "PATCH":
                                value = await resource.patch(data);
                                Object.assign(result, {status: (value ? "200" : "204")}, (value ? {location: value?.meta?.location} : {}));
                                break;
                                
                            case "DELETE":
                                await resource.dispose();
                                Object.assign(result, {status: "204"});
                                break;
                        }
                    } catch (ex) {
                        // Set the error variable for final handling
                        error = new ErrorMessage(ex);
                    }
                }
                
                // If there was an error, store result and increment error count
                if (error instanceof ErrorMessage) {
                    Object.assign(result, {status: error.status, response: error, location: (String(method).toUpperCase() !== "POST" ? result.location : undefined)});
                    this.#errorCount++;
                }
            }
        }
        
        return this;
    }
}