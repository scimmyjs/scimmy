// HTTP response status codes and SCIM detail error keywords specified by RFC7644§3.12
const validStatusCodes = [307, 308, 400, 401, 403, 404, 409, 412, 413, 500, 501];
const validScimTypes = [
    "invalidFilter", "tooMany", "uniqueness", "mutability", "invalidSyntax",
    "invalidPath", "noTarget", "invalidValue", "invalidVers", "sensitive"
];

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
        this.schemas = [Error.#id];
        
        // Validate the supplied parameters
        if (!validStatusCodes.includes(Number(status)))
            throw new TypeError(`Incompatible HTTP status code '${status}' supplied to SCIM Error Message constructor`);
        if (!!scimType && !validScimTypes.includes(scimType))
            throw new TypeError(`Unknown detail error keyword '${scimType}' supplied to SCIM Error Message constructor`);
        if (!!scimType && Number(status) !== 400)
            throw new TypeError(`HTTP status code must be '400' when detail error keyword supplied to SCIM Error Message constructor`);
        
        // No exceptions thrown, assign the parameters to the instance
        this.status = String(status);
        if (!!scimType) this.scimType = scimType;
        this.detail = detail;
    }
}