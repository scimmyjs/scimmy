import {isDeepStrictEqual} from "util";
import {Error as SCIMError, SchemaDefinition, Attribute} from "../types.js";

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
     * SCIM SchemaDefinition instance for resource being patched
     * @type {SchemaDefinition}
     */
    #schema;
    
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
     * @param {Schema} resource - the schema instance the patch operation will be performed on
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
            let index = (operations.indexOf(operation) + 1),
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
                throw new SCIMError(400, "invalidPath", `Invalid path '${path}' for operation ${index} in PatchOp request body`);
        }
        
        // Store details about the resource being patched
        this.#schema = resource.constructor.definition;
        this.#source = resource;
        this.#target = new resource.constructor(resource, "out");
        
        // Store the attributes that define a PatchOp
        this.schemas = [PatchOp.#id];
        this.Operations = operations;
    }
    
    /**
     * Apply patch operations to a resource as defined by the PatchOp instance
     * @return {Schema|Schema[]}
     */
    apply() {
        // Go through all specified operations
        for (let operation of this.Operations) {
            let index = (this.Operations.indexOf(operation) + 1),
                {op, path, value} = operation;
            
            // And action it
            this[op.toLowerCase()](index, path, value);
        }
        
        // Only return value if something has changed
        if (!isDeepStrictEqual(this.#source, this.#target))
            return this.#target;
    }
    
    /**
     * Perform the "add" operation on the resource
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} [path] - if supplied, specifies path to the attribute being added
     * @param {*|*[]} value - value being added to the resource or attribute specified by path
     */
    add(index, path, value) {
        if (path === undefined) {
            // If path is unspecified, value must be a plain object
            if (typeof value !== "object" || Array.isArray(value))
                throw new SCIMError(400, "invalidValue", `Attribute 'value' must be an object when 'path' is empty for 'add' op of operation ${index} in PatchOp request body`);
            
            // Go through and add the data specified by value
            for (let [key, val] of Object.entries(value)) {
                try {
                    // TODO: handle add operation for multiValue attributes
                    this.#target[key] = val;
                } catch (ex) {
                    if (ex instanceof SCIMError) {
                        // Add additional context to SCIM errors
                        ex.message += ` for 'add' op of operation ${index} in PatchOp request body`;
                        throw ex;
                    } else {
                        // Rethrow other exceptions as SCIM errors
                        throw new SCIMError(400, "invalidValue", `Value '${val}' not valid for attribute '${key}' of 'add' operation ${index} in PatchOp request body`);
                    }
                }
            }
        } else {
            // TODO: handle when path specified...
        }
    }
    
    /**
     * Perform the "remove" operation on the resource
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} path - specifies path to the attribute being removed
     */
    remove(index, path) {
        // TODO: remove op...
    }
    
    /**
     * Perform the "replace" operation on the resource
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} [path] - if supplied, specifies path to the attribute being replaced
     * @param {*|*[]} value - value being replaced on the resource or attribute specified by path
     */
    replace(index, path, value) {
        // TODO: replace op...
    }
}