/**
 * SCIM Error Message Type
 */
export class Error {
    /**
     * SCIM Error Message Schema ID
     * @type {String}
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:Error";
    
    /**
     * Instantiate a new SCIM Error Message with relevant details
     * @param {Number} status - HTTP status code to be sent with the error
     * @param {String} scimType - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @param {String} detail - a human-readable description of what caused the error to occur
     */
    constructor(status, scimType, detail) {
        // TODO: validate the contents of the instantiated Error message
        this.schemas = [Error.#id];
        this.status = status;
        if (!!scimType) this.scimType = scimType;
        this.detail = detail;
    }
}