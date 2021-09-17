/**
 * SCIM List Response Message Type
 */
export class ListResponse {
    /**
     * SCIM List Response Message Schema ID
     * @type {String}
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
    
    /**
     * Instantiate a new SCIM List Response Message with relevant details
     * @param {Schema[]} resources - items to include in the list response
     * @param {Number} [startIndex=1] - offset index that items start from
     * @param {Number} [itemsPerPage=20] - maximum number of items returned in this list response
     */
    constructor(resources = [], startIndex = 1, itemsPerPage = 20) {
        // TODO: validate the contents of the instantiated ListResponse message
        this.schemas = [ListResponse.#id];
        this.totalResults = resources.length;
        this.Resources = resources;
        this.startIndex = startIndex;
        this.itemsPerPage = itemsPerPage;
    }
}