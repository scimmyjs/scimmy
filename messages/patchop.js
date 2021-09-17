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
     * Instantiate a new SCIM Patch Operation Message with relevant details
     * @param {Object[]} [operations] - actions to perform in the patch operation
     */
    constructor(operations = []) {
        this.schemas = [PatchOp.#id];
        this.Operations = operations;
    }
}