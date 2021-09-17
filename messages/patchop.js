import {Error as SCIMError} from "../types.js";

/**
 * List of valid SCIM patch operations
 * @type {string[]}
 */
const validOps = ["add", "remove", "replace"];

/**
 * SCIM Patch Operation Message Type
 */
export class PatchOp {
    /**
     * SCIM Patch Operation Message Schema ID
     * @type {String}
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:PatchOp";
    
    /**
     * SCIM Resource instance performing the patch operation
     * @type {Resource}
     */
    #resource;
    
    /**
     * Original SCIM Schema resource instance being patched
     * @type {Schema|Schema[]}
     */
    #source;
    
    /**
     * Target SCIM Schema resource instance to apply patches to
     * @type {Schema|Schema[]}
     */
    #target;
    
    /**
     * Instantiate a new SCIM Patch Operation Message with relevant details
     * @param {Object} request - contents of the patch operation request being performed
     * @param {Resource} resource - the resource type instance performing the patch operation
     */
    constructor(request = {}, resource) {
        let {schemas = [], Operations: operations = []} = request;
        
        // Make sure specified schema is valid
        if (schemas.length !== 1 || !schemas.includes(PatchOp.#id))
            throw new SCIMError(400, "invalidSyntax", `PatchOp request body messages must exclusively specify schema as '${PatchOp.#id}'`);
        
        // Make sure request body contains operations to perform
        if (!operations.length)
            throw new SCIMError(400, "invalidValue", "PatchOp request body must contain 'Operations' attribute with at least one operation");
        
        // Make sure all specified operations are valid
        for (let operation of operations) {
            let index = operations.indexOf(operation)+1,
                {op, path, value} = operation;
            
            // Make sure all operations have a valid action defined
            if (op === undefined)
                throw new SCIMError(400, "invalidValue", `Missing required attribute 'op' from operation ${index} in PatchOp request body`);
            if (typeof op !== "string" || !validOps.includes(op.toLowerCase()))
                throw new SCIMError(400, "invalidSyntax", `Invalid operation '${op}' for operation ${index} in PatchOp request body`);
            
            // Make sure value attribute is specified for "add" operations
            if ("add" === op.toLowerCase() && value === undefined)
                throw new SCIMError(400, "invalidValue", `Missing required attribute 'value' for 'add' op of operation ${index} in PatchOp request body`);
            // Make sure path attribute is specified for "remove" operations
            if ("remove" === op.toLowerCase() && path === undefined)
                throw new SCIMError(400, "noTarget", `Missing required attribute 'path' for 'remove' op of operation ${index} in PatchOp request body`);
            // Make sure path attribute is a string
            if (!!path && typeof path !== "string")
                throw new SCIMError(400, "invalidSyntax", `Invalid path '${path}' for operation ${index} in PatchOp request body`);
        }
        
        // Store the attributes that define a PatchOp
        this.#resource = resource;
        this.schemas = [PatchOp.#id];
        this.Operations = operations;
    }
    
    /**
     * Apply patch operations to a resource as defined by the PatchOp instance
     * @return {Promise<Schema|Schema[]>}
     */
    async apply() {
        this.#source = this.#target = await this.#resource.read();
        // TODO: apply the patch operations...
        return this.#target;
    }
}