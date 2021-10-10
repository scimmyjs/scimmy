import {isDeepStrictEqual} from "util";
import Types from "../types.js";

// List of valid SCIM patch operations
const validOps = ["add", "remove", "replace"];
// Split a path by fullstops when they aren't in a filter group or decimal
const pathSeparator = /(?!((?<!\w)\d)|(\[.*?))\.(?!(\d(?!\w))|(.*?\]))/g;
// Extract attributes and filter strings from path parts
const multiValuedFilter = /^(.+?)(\[(?:.*?)\])?$/g;

/**
 * SCIM Patch Operation Message Type
 * @alias SCIMMY.Messages.PatchOp
 */
export class PatchOp {
    /**
     * SCIM Patch Operation Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:PatchOp";
    
    /**
     * SCIM SchemaDefinition instance for resource being patched
     * @type {SCIMMY.Types.SchemaDefinition}
     * @private
     */
    #schema;
    
    /**
     * Original SCIM Schema resource instance being patched
     * @type {SCIMMY.Types.Schema|SCIMMY.Types.Schema[]}
     * @private
     */
    #source;
    
    /**
     * Target SCIM Schema resource instance to apply patches to
     * @type {SCIMMY.Types.Schema|SCIMMY.Types.Schema[]}
     * @private
     */
    #target;
    
    /**
     * Instantiate a new SCIM Patch Operation Message with relevant details
     * @constructs SCIMMY.Messages.PatchOp
     * @param {Object} request - contents of the patch operation request being performed
     * @param {SCIMMY.Types.Schema} resource - the schema instance the patch operation will be performed on
     */
    constructor(request = {}, resource) {
        let {schemas = [], Operations: operations = []} = request;
        
        // Make sure specified schema is valid
        if (schemas.length !== 1 || !schemas.includes(PatchOp.#id))
            throw new Types.Error(400, "invalidSyntax", `PatchOp request body messages must exclusively specify schema as '${PatchOp.#id}'`);
        
        // Make sure request body contains operations to perform
        if (!operations.length)
            throw new Types.Error(400, "invalidValue", "PatchOp request body must contain 'Operations' attribute with at least one operation");
        
        // Make sure all specified operations are valid
        for (let operation of operations) {
            let index = (operations.indexOf(operation) + 1),
                {op, path, value} = operation;
            
            // Make sure all operations have a valid action defined
            if (op === undefined)
                throw new Types.Error(400, "invalidValue", `Missing required attribute 'op' from operation ${index} in PatchOp request body`);
            if (typeof op !== "string" || !validOps.includes(op.toLowerCase()))
                throw new Types.Error(400, "invalidSyntax", `Invalid operation '${op}' for operation ${index} in PatchOp request body`);
            
            // Make sure value attribute is specified for "add" operations
            if ("add" === op.toLowerCase() && value === undefined)
                throw new Types.Error(400, "invalidValue", `Missing required attribute 'value' for 'add' op of operation ${index} in PatchOp request body`);
            // Make sure path attribute is specified for "remove" operations
            if ("remove" === op.toLowerCase() && path === undefined)
                throw new Types.Error(400, "noTarget", `Missing required attribute 'path' for 'remove' op of operation ${index} in PatchOp request body`);
            // Make sure path attribute is a string
            if (!!path && typeof path !== "string")
                throw new Types.Error(400, "invalidPath", `Invalid path '${path}' for operation ${index} in PatchOp request body`);
        }
        
        // Bail out if resource is specified, and it's not a Schema instance
        if (!(resource instanceof Types.Schema) && resource !== undefined)
            throw new TypeError("PatchOp expected 'resource' to be an instance of Schema");
        
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
     * @alias apply
     * @memberOf SCIMMY.Messages.PatchOp
     * @param {Function} [finalise] - method to call when all operations are complete, to feed target back through model
     * @returns {SCIMMY.Types.Schema|SCIMMY.Types.Schema[]} an instance of the resource modified as per the included patch operations
     */
    async apply(finalise) {
        // Go through all specified operations
        for (let operation of this.Operations) {
            let index = (this.Operations.indexOf(operation) + 1),
                {op, path, value} = operation;
            
            // And action it
            this[op.toLowerCase()](index, path, value);
        }
        
        // If finalise is a method, feed it the target to retrieve final representation of resource
        if (typeof finalise === "function")
            this.#target = new this.#target.constructor(await finalise(this.#target), "out");
        
        // Only return value if something has changed
        if (!isDeepStrictEqual({...this.#source, meta: undefined}, {...this.#target, meta: undefined}))
            return this.#target;
    }
    
    /**
     * Dig in to an operation's path, making sure it is valid, and yields actual targets to patch
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} path - specifies path to the attribute or value being patched
     * @param {String} op - the operation being performed, for use in error messages
     * @returns {SCIMMY.Messages.PatchOp~PatchOpDetails}
     * @private
     */
    #resolve(index, path, op) {
        // Work out parts of the supplied path
        let paths = path.split(pathSeparator).filter(p => p),
            targets = [this.#target],
            property, attribute, multiValued;
        
        try {
            // Remove any filters from the path and attempt to get targeted attribute definition
            attribute = this.#schema.attribute(paths.map(p => p.replace(multiValuedFilter, "$1")).join("."));
            multiValued = attribute?.config?.multiValued ?? false;
        } catch {
            // Rethrow exceptions as SCIM errors when attribute wasn't found
            throw new Types.Error(400, "invalidPath", `Invalid path '${path}' for '${op}' op of operation ${index} in PatchOp request body`);
        }
        
        // Traverse the path
        while (paths.length > 0) {
            let path = paths.shift(),
                // Work out if path contains a filter expression
                [, key = path, filter] = multiValuedFilter.exec(path) ?? [];
            
            // We have arrived at our destination
            if (paths.length === 0) {
                property = (!filter ? key : false);
                multiValued = (multiValued ? !filter : multiValued);
            }
            
            // Traverse deeper into each existing target
            for (let target of targets.splice(0)) {
                if (target !== undefined) try {
                    if (filter !== undefined) {
                        // If a filter is specified, apply it to the target and add results back to targets
                        targets.push(...(new Types.Filter(filter).match(target[key])));
                    } else {
                        // Add the traversed value to targets, or back out if already arrived
                        targets.push(paths.length === 0 ? target : target[key] ?? (op === "add" ? ((target[key] = target[key] ?? {}) && target[key]) : undefined));
                    }
                } catch {
                    // Nothing to do here, carry on
                }
            }
        }
        
        // No targets, bail out!
        if (targets.length === 0)
            throw new Types.Error(400, "noTarget", `Filter '${path}' does not match any values for '${op}' op of operation ${index} in PatchOp request body`);
        
        /**
         * @typedef {Object} SCIMMY.Messages.PatchOp~PatchOpDetails
         * @private
         * @property {Boolean} complex - whether the target attribute value should be complex
         * @property {Boolean} multiValued - whether the target attribute expects a collection of values
         * @property {String} property - name of the targeted attribute to apply values to
         * @property {Object[]} targets - the resources containing the attributes to apply values to
         */
        return {
            complex: (attribute instanceof Types.SchemaDefinition ? true : attribute.type === "complex"),
            multiValued: multiValued,
            property: property,
            targets: targets
        };
    }
    
    /**
     * Perform the "add" operation on the resource
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} path - if supplied, specifies path to the attribute being added
     * @param {any|any[]} value - value being added to the resource or attribute specified by path
     * @private
     */
    add(index, path, value) {
        if (path === undefined) {
            // If path is unspecified, value must be a plain object
            if (typeof value !== "object" || Array.isArray(value))
                throw new Types.Error(400, "invalidValue", `Attribute 'value' must be an object when 'path' is empty for 'add' op of operation ${index} in PatchOp request body`);
            
            // Go through and add the data specified by value
            for (let [key, val] of Object.entries(value)) {
                if (typeof value[key] === "object") this.add(index, key, value[key]);
                else try {
                    this.#target[key] = val;
                } catch (ex) {
                    if (ex instanceof Types.Error) {
                        // Add additional context to SCIM errors
                        ex.message += ` for 'add' op of operation ${index} in PatchOp request body`;
                        throw ex;
                    } else {
                        // Rethrow other exceptions as SCIM errors
                        throw new Types.Error(400, "invalidValue", `Value '${val}' not valid for attribute '${key}' of 'add' operation ${index} in PatchOp request body`);
                    }
                }
            }
        } else {
            // Validate and extract details about the operation
            let {targets, property, multiValued, complex} = this.#resolve(index, path, "add");
            
            // Go and apply the operation to matching targets
            for (let target of targets) {
                try {
                    // The target is expected to be a collection
                    if (multiValued) {
                        // Wrap objects as arrays
                        let values = (Array.isArray(value) ? value : [value]);
                        
                        // Add the values to the existing collection, or create a new one if it doesn't exist yet
                        if (Array.isArray(target[property])) target[property].push(...values);
                        else target[property] = values;
                    }
                    // The target is a complex attribute - add specified values to it
                    else if (complex) {
                        if (!property) Object.assign(target, value);
                        else if (target[property] === undefined) target[property] = value;
                        else Object.assign(target[property], value);
                    }
                    // The target is not a collection or a complex attribute - assign the value
                    else target[property] = value;
                } catch (ex) {
                    // Rethrow exceptions as SCIM errors
                    throw new Types.Error(400, "invalidValue", ex.message + ` for 'add' op of operation ${index} in PatchOp request body`);
                }
            }
        }
    }
    
    /**
     * Perform the "remove" operation on the resource
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} path - specifies path to the attribute being removed
     * @param {any|any[]} value - value being removed from the resource or attribute specified by path
     * @private
     */
    remove(index, path, value) {
        // Validate and extract details about the operation
        let {targets, property, complex, multiValued} = this.#resolve(index, path, "remove");
        
        // If there's a property defined, we have an easy target for removal
        if (property) {
            // Go through and remove the property from the targets
            for (let target of targets) {
                try {
                    // No value filter defined, or target is not multi-valued - unset the property
                    if (value === undefined || !multiValued) target[property] = undefined;
                    // Multi-valued target, attempt removal of matching values from attribute
                    else if (multiValued) {
                        // Make sure filter values is an array for easy use of "includes" comparison when filtering
                        let values = (Array.isArray(value) ? value : [value]),
                            // If values are complex, build a filter to match with - otherwise just use values
                            removals = (!complex || values.every(v => Object.isFrozen(v)) ? values : new Types.Filter(values
                                .map(f => Object.entries(f)
                                    // Get rid of any empty values from the filter
                                    .filter(([, value]) => value !== undefined)
                                    // Turn it into an equity filter string
                                    .map(([key, value]) => (`${key} eq ${value}`)).join(" and "))
                                .join(" or "))
                                // Get any matching values from the filter
                                .match(target[property]));
                        
                        // Filter out any values that exist in removals list
                        target[property] = (target[property] ?? []).filter(v => !removals.includes(v));
                        // Unset the property if it's now empty
                        if (target[property].length === 0) target[property] = undefined;
                    }
                } catch (ex) {
                    // Rethrow exceptions as SCIM errors
                    throw new Types.Error(400, "invalidValue", ex.message + ` for 'remove' op of operation ${index} in PatchOp request body`);
                }
            }
        } else {
            // Get path to the parent attribute having values removed
            let parentPath = path.split(pathSeparator).filter(v => v)
                .map((path, index, paths) => (index < paths.length-1 ? path : path.replace(multiValuedFilter, "$1")))
                .join(".");
            
            // Remove targeted values from parent attributes
            this.remove(index, parentPath, targets);
        }
    }
    
    /**
     * Perform the "replace" operation on the resource
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} path - if supplied, specifies path to the attribute being replaced
     * @param {any|any[]} value - value being replaced on the resource or attribute specified by path
     */
    replace(index, path, value) {
        try {
            // Call remove, then call add!
            if (path !== undefined) this.remove(index, path);
            this.add(index, path, value);
        } catch (ex) {
            // Rethrow exceptions with 'replace' instead of 'add' or 'remove'
            let forReplaceOp = "for 'replace' op";
            ex.message = ex.message.replace("for 'add' op", forReplaceOp).replace("for 'remove' op", forReplaceOp);
            throw ex;
        }
    }
}