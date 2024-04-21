import {ErrorMessage} from "./error.js";
import {BulkResponse} from "./bulkresponse.js";
import Types from "../types.js";
import Resources from "../resources.js";

/**
 * List of valid HTTP methods in a SCIM bulk request operation
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidBulkMethods
 * @memberOf SCIMMY.Messages.BulkRequest
 * @default
 */
const validMethods = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * SCIM Bulk Request Message
 * @alias SCIMMY.Messages.BulkRequest
 * @since 1.0.0
 * @summary
 * *   Parses [BulkRequest messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.7), making sure "Operations" have been specified, and conform with the SCIM protocol.
 * *   Provides a method to apply BulkRequest operations and return the results as a BulkResponse.
 */
export class BulkRequest {
    /**
     * SCIM BulkRequest Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:BulkRequest";
    
    /**
     * Whether the incoming BulkRequest has been applied 
     * @type {Boolean}
     * @private
     */
    #dispatched = false;
    
    /**
     * Instantiate a new SCIM BulkResponse message from the supplied BulkRequest
     * @param {Object} request - contents of the BulkRequest operation being performed
     * @param {Object[]} request.Operations - list of SCIM-compliant bulk operations to apply
     * @param {Number} [request.failOnErrors] - number of error results to encounter before aborting any following operations
     * @param {Number} [maxOperations] - maximum number of operations supported in the request, as specified by the service provider
     * @property {Object[]} Operations - list of operations in this BulkRequest instance
     * @property {Number} [failOnErrors] - number of error results a service provider should tolerate before aborting any following operations
     */
    constructor(request, maxOperations = 0) {
        let {schemas = [], Operations: operations = [], failOnErrors = 0} = request ?? {};
        
        // Make sure specified schema is valid
        if (schemas.length !== 1 || !schemas.includes(BulkRequest.#id))
            throw new Types.Error(400, "invalidSyntax", `BulkRequest request body messages must exclusively specify schema as '${BulkRequest.#id}'`);
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
        
        // All seems OK, prepare the BulkRequest body
        this.schemas = [BulkRequest.#id];
        this.Operations = [...operations];
        if (failOnErrors) this.failOnErrors = failOnErrors;
    }
    
    /**
     * Apply the operations specified by the supplied BulkRequest 
     * @param {typeof SCIMMY.Types.Resource[]} [resourceTypes] - resource type classes to be used while processing bulk operations, defaults to declared resources
     * @returns {SCIMMY.Messages.BulkResponse} a new BulkResponse Message instance with results of the requested operations 
     */
    async apply(resourceTypes = Object.values(Resources.declared())) {
        // Bail out if BulkRequest message has already been applied
        if (this.#dispatched) 
            throw new TypeError("BulkRequest 'apply' method must not be called more than once");
        // Make sure all specified resource types extend the Resource type class so operations can be processed correctly 
        else if (!resourceTypes.every(r => r.prototype instanceof Types.Resource))
            throw new TypeError("Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of BulkRequest");
        // Seems OK, mark the BulkRequest as dispatched so apply can't be called again
        else this.#dispatched = true;
        
        // Set up easy access to resource types by endpoint, and store pending results
        const typeMap = new Map(resourceTypes.map((r) => [r.endpoint, r]));
        const results = [];
        
        // Get a map of POST ops with bulkIds for direct and circular reference resolution
        const bulkIds = new Map(this.Operations
            .filter(o => o.method === "POST" && !!o.bulkId && typeof o.bulkId === "string")
            .map(({bulkId}, index, postOps) => {
                // Establish who waits on what, and provide a way for that to happen
                const handlers = {referencedBy: postOps.filter(({data}) => JSON.stringify(data ?? {}).includes(`bulkId:${bulkId}`)).map(({bulkId}) => bulkId)};
                const value = new Promise((resolve, reject) => Object.assign(handlers, {resolve, reject}));
                
                return [bulkId, Object.assign(value, handlers)];
            })
        );
        
        // Turn them into a list for operation ordering
        const bulkIdTransients = [...bulkIds.keys()];
        
        // Establish error handling for the entire list of operations
        const errorLimit = this.failOnErrors;
        let errorCount = 0,
            lastErrorIndex = this.Operations.length + 1;
        
        for (let op of this.Operations) results.push((async () => {
            // Unwrap useful information from the operation
            const {method, bulkId: opBulkId, path = "", data} = op;
            // Ignore the bulkId unless method is POST
            const bulkId = (String(method).toUpperCase() === "POST" ? opBulkId : undefined);
            // Evaluate endpoint and resource ID, and thus what kind of resource we're targeting 
            const [endpoint, id] = (typeof path === "string" ? path : "").substring(1).split("/");
            const TargetResource = (endpoint ? typeMap.get(`/${endpoint}`) : false);
            // Construct a location for the response, and prepare common aspects of the result
            const location = (TargetResource ? [TargetResource.basepath() ?? TargetResource.endpoint, id].filter(v => v).join("/") : path || undefined);
            const result = {method, bulkId: (typeof bulkId === "string" ? bulkId : undefined), location: (typeof location === "string" ? location : undefined)};
            // Get op data and find out if this op waits on any other operations
            const jsonData = (!!data ? JSON.stringify(data) : "");
            const waitingOn = (!jsonData.includes("bulkId:") ? [] : [...new Set([...jsonData.matchAll(/"bulkId:(.+?)"/g)].map(([, id]) => id))]);
            const {referencedBy = []} = bulkIds.get(bulkId) ?? {};
            // Establish error handling for this operation
            const index = this.Operations.indexOf(op) + 1;
            const errorSuffix = `in BulkRequest operation #${index}`;
            let error = false;
            
            // If not the first operation, and there's no circular references, wait on prior operations
            if (index > 1 && (!bulkId || !waitingOn.length || !waitingOn.some(id => referencedBy.includes(id)))) {
                // Check to see if any preceding operations reference this one
                const dependents = referencedBy.map(bulkId => bulkIdTransients.indexOf(bulkId));
                // Then filter them out, so they aren't waited on, and get results of the last operation
                const precedingOps = results.slice(0, index - 1).filter((v, i) => !dependents.includes(i));
                const lastOp = (await Promise.all(precedingOps)).pop();
                
                // If there was last operation, and it failed, and error limit reached, bail out here
                if (precedingOps.length && (!lastOp || (lastOp.response instanceof ErrorMessage && !(!errorLimit || (errorCount < errorLimit)))))
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
            else if (!waitingOn.every((id) => bulkIds.has(id)))
                error = new ErrorMessage(new Types.Error(400, "invalidValue", `No POST operation found matching bulkId '${waitingOn.find((id) => !bulkIds.has(id))}'`));
            // If things look OK, attempt to apply the operation
            else try {
                // Get replaceable data for reference resolution
                let {data} = op;
                
                // Go through and wait on any referenced POST bulkIds
                for (let referenceId of waitingOn) {
                    // Find the referenced operation to wait for
                    const reference = bulkIds.get(referenceId);
                    const referenceIndex = bulkIdTransients.indexOf(referenceId);
                    
                    // If the reference is also waiting on us, we have ourselves a circular reference!
                    if (bulkId && !id && reference.referencedBy.includes(bulkId) && (bulkIdTransients.indexOf(bulkId) < referenceIndex)) {
                        // Attempt to POST self without reference so referenced operation can complete and give us its ID!
                        const {id} = await new TargetResource().write(Object.entries(data)
                            // Remove any values that reference a bulkId
                            .filter(([,v]) => !JSON.stringify(v).includes("bulkId:"))
                            .reduce((res, [k, v]) => Object.assign(res, {[k]: v}), {}));
                        
                        // Set the ID for future use and resolve pending references
                        Object.assign(data, {id})
                        bulkIds.get(bulkId).resolve(id);
                    }
                    
                    try {
                        // Replace reference with real value once resolved, preserving any new resource ID
                        data = Object.assign(JSON.parse(jsonData.replaceAll(`bulkId:${referenceId}`, await reference)), {id: data.id});
                    } catch (ex) {
                        // Referenced POST operation precondition failed, remove any created resource and bail out
                        if (bulkId && data.id) await new TargetResource(data.id).dispose();
                        
                        // If we're following on from a prior failure, no need to explain why, otherwise, explain the failure
                        if (ex instanceof ErrorMessage && (!!errorLimit && errorCount >= errorLimit && index > lastErrorIndex)) return;
                        else throw new Types.Error(412, null, `Referenced POST operation with bulkId '${referenceId}' was not successful`);
                    }
                }
                
                // Get ready
                const resource = new TargetResource(data?.id ?? id);
                let value;
                
                // Do the thing!
                switch (method.toUpperCase()) {
                    case "POST":
                    case "PUT":
                        value = await resource.write(data);
                        if (bulkId && !resource.id && value?.id) bulkIds.get(bulkId).resolve(value?.id); 
                        break;
                        
                    case "PATCH":
                        value = await resource.patch(data);
                        break;
                        
                    case "DELETE":
                        await resource.dispose();
                        break;
                }
                
                Object.assign(result, {status: (value ? (!bulkId ? "200" : "201") : "204")}, (value ? {location: value?.meta?.location} : {}));
            } catch (ex) {
                // Coerce the exception into a SCIMError
                if (!(ex instanceof Types.Error)) 
                    ex = new Types.Error(...(ex instanceof TypeError ? [400, "invalidValue"] : [500, null]), ex.message);
                
                // Set the error variable for final handling, and reject any pending operations
                error = new ErrorMessage(ex);
            }
            
            // If there was an error, store result and increment error count
            if (error instanceof ErrorMessage) {
                Object.assign(result, {status: error.status, response: error, location: (String(method).toUpperCase() !== "POST" ? result.location : undefined)});
                lastErrorIndex = (index < lastErrorIndex ? index : lastErrorIndex);
                errorCount++;
                
                // Also reject the pending bulkId promise as no resource ID can exist
                if (bulkId && bulkIds.has(bulkId)) bulkIds.get(bulkId).reject(error);
            }
            
            return result;
        })());
        
        // Await the results and return a new BulkResponse
        return new BulkResponse((await Promise.all(results)).filter(r => r));
    }
}