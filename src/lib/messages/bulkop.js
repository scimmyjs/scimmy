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
     * POST operations that will have their bulkId resolved into a real ID
     * @type {Map<String, Object>}
     * @private
     */
    #bulkIds;
    
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
        
        // Get a list of POST ops with bulkIds for direct and circular reference resolution
        let postOps = operations.filter(o => o.method === "POST" && !!o.bulkId && typeof o.bulkId === "string");
        
        // Store details of BulkRequest to be applied
        this.#errorLimit = failOnErrors;
        this.#bulkOperations = operations;
        this.#bulkIds = new Map(postOps.map(({bulkId}) => {
            // Establish who waits on what, and provide a way for that to happen
            let handlers = {referencedBy: postOps.filter(({data}) => JSON.stringify(data).includes(`bulkId:${bulkId}`)).map(({bulkId}) => bulkId)},
                value = new Promise((resolve, reject) => Object.assign(handlers, {resolve: resolve, reject: reject}));
            
            return [bulkId, Object.assign(value, handlers)];
        }));
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
        
        // Set up easy access to resource types by endpoint, and store pending results
        let typeMap = new Map(resourceTypes.map((r) => [r.endpoint, r])),
            bulkIdTransients = [...this.#bulkIds.keys()],
            lastErrorIndex = this.#bulkOperations.length + 1,
            results = [];
        
        for (let op of this.#bulkOperations) results.push((async () => {
            // Unwrap useful information from the operation
            let {method, bulkId, path = "", data} = op,
                // Evaluate endpoint and resource ID, and thus what kind of resource we're targeting 
                [endpoint, id] = path.substring(1).split("/"),
                    TargetResource = (endpoint ? typeMap.get(`/${endpoint}`) : false),
                // Construct a location for the response, and prepare common aspects of the result
                location = (TargetResource ? [TargetResource.basepath() ?? TargetResource.endpoint, id].filter(v => v).join("/") : path),
                result = {method: method, bulkId: bulkId, location: location},
                // Find out if this op waits on any other operations 
                jsonData = (!!data ? JSON.stringify(data) : ""),
                waitingOn = (!jsonData.includes("bulkId:") ? [] : [...new Set([...jsonData.matchAll(/"bulkId:(.+?)"/g)].map(([, id]) => id))]),
                // Establish error handling
                index = this.#bulkOperations.indexOf(op) + 1,
                errorSuffix = `in BulkRequest operation #${index}`,
                error = false;
            
            // Ignore the bulkId unless method is POST
            bulkId = (String(method).toUpperCase() === "POST" ? bulkId : false);
            
            // If not the first operation, and there's no circular references, wait on all prior operations
            if (index > 1 && (!bulkId || !waitingOn.length || !waitingOn.some(id => this.#bulkIds.get(bulkId).referencedBy.includes(id)))) {
                let lastOp = (await Promise.all(results.slice(0, index - 1))).pop();
                
                // If the last operation failed, and error limit reached, bail out here
                if (!lastOp || (lastOp.response instanceof ErrorMessage && !(!this.#errorLimit || (this.#errorCount < this.#errorLimit))))
                    return;
            }
            
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
            else if (![...typeMap.keys()].includes(`/${endpoint}`))
                error = new ErrorMessage(new Types.Error(400, "invalidValue", `Invalid 'path' value '${path}' ${errorSuffix}`));
            // Make sure there IS a bulkId if the method is POST
            else if (method.toUpperCase() === "POST" && !bulkId && bulkId !== false)
                error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `POST operation missing required 'bulkId' string ${errorSuffix}`));
            // Make sure there IS a bulkId if the method is POST
            else if (method.toUpperCase() === "POST" && typeof bulkId !== "string")
                error = new ErrorMessage(new Types.Error(400, "invalidValue", `POST operation expected 'bulkId' to be a string ${errorSuffix}`));
            // Make sure there ISN'T a resource targeted if the method is POST
            else if (method.toUpperCase() === "POST" && !!id)
                error = new ErrorMessage(new Types.Error(404, null, `POST operation must not target a specific resource ${errorSuffix}`));
            // Make sure there IS a resource targeted if the method isn't POST
            else if (method.toUpperCase() !== "POST" && !id)
                error = new ErrorMessage(new Types.Error(404, null, `${method.toUpperCase()} operation must target a specific resource ${errorSuffix}`));
            // Make sure data is an object, if method isn't DELETE
            else if (method.toUpperCase() !== "DELETE" && (Object(data) !== data || Array.isArray(data)))
                error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Expected 'data' to be a single complex value ${errorSuffix}`))
            // Make sure any bulkIds referenced in data can eventually be resolved
            else if (!waitingOn.every((id) => this.#bulkIds.has(id)))
                error = new ErrorMessage(new Types.Error(400, "invalidValue", `No POST operation found matching bulkId '${waitingOn.find((id) => !this.#bulkIds.has(id))}'`));
            // If things look OK, attempt to apply the operation
            else {
                try {
                    // Go through and wait on any referenced POST bulkIds
                    for (let referenceId of waitingOn) {
                        // Find the referenced operation to wait for
                        let reference = this.#bulkIds.get(referenceId),
                            referenceIndex = bulkIdTransients.indexOf(referenceId);
                        
                        // If the reference is also waiting on us, we have ourselves a circular reference!
                        if (bulkId && !id && reference.referencedBy.includes(bulkId) && (bulkIdTransients.indexOf(bulkId) < referenceIndex)) {
                            // Attempt to POST self without reference so referenced operation can complete and give us its ID!
                            ({id} = await new TargetResource().write(Object.entries(data)
                                // Remove any values that reference a bulkId
                                .filter(([,v]) => !JSON.stringify(v).includes("bulkId:"))
                                .reduce((res, [k, v]) => (((res[k] = v) || true) && res), {})));
                            
                            // Set the ID for future use and resolve pending references
                            jsonData = JSON.stringify(Object.assign(data, {id: id}));
                            this.#bulkIds.get(bulkId).resolve(id);
                        }
                        
                        try {
                            // Replace reference with real value once resolved
                            jsonData = jsonData.replaceAll(`bulkId:${referenceId}`, await reference);
                            data = JSON.parse(jsonData);
                        } catch (ex) {
                            // Referenced POST operation precondition failed, remove any created resource and bail out
                            if (bulkId && id) await new TargetResource(id).dispose();
                            
                            // If we're following on from a prior failure, no need to explain why, otherwise, explain the failure
                            if (ex instanceof ErrorMessage && (!!this.#errorLimit && this.#errorCount >= this.#errorLimit && index > lastErrorIndex)) return;
                            else throw new Types.Error(412, null, `Referenced POST operation with bulkId '${referenceId}' was not successful`);
                        }
                    }
                    
                    // Get ready
                    let resource = new TargetResource(id),
                        value;
                    
                    // Do the thing!
                    switch (method.toUpperCase()) {
                        case "POST":
                        case "PUT":
                            value = await resource.write(data);
                            if (bulkId && !resource.id && value.id) this.#bulkIds.get(bulkId).resolve(value.id); 
                            Object.assign(result, {status: (!bulkId ? "200" : "201"), location: value?.meta?.location});
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
                    // Coerce the exception into a SCIMError
                    if (!(ex instanceof Types.Error)) 
                        ex = new Types.Error(...(ex instanceof TypeError ? [400, "invalidValue"] : [500, null]), ex.message);
                    
                    // Set the error variable for final handling, and reject any pending operations
                    error = new ErrorMessage(ex);
                }
            }
            
            // If there was an error, store result and increment error count
            if (error instanceof ErrorMessage) {
                Object.assign(result, {status: error.status, response: error, location: (String(method).toUpperCase() !== "POST" ? result.location : undefined)});
                lastErrorIndex = (index < lastErrorIndex ? index : lastErrorIndex);
                this.#errorCount++;
                
                // Also reject the pending bulkId promise as no resource ID can exist
                if (bulkId) this.#bulkIds.get(bulkId).reject(error);
            }
            
            return result;
        })());
        
        // Store the results and return the BulkOp for chaining
        this.Operations.push(...(await Promise.all(results)).filter(r => r));
        return this;
    }
}