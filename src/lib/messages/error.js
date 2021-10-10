// HTTP response status codes and SCIM detail error keywords specified by RFC7644§3.12
const validStatusCodes = [307, 308, 400, 401, 403, 404, 409, 412, 413, 500, 501];
const validScimTypes = [
    "uniqueness", "tooMany", "invalidFilter", "mutability", "invalidSyntax",
    "invalidPath", "noTarget", "invalidValue", "invalidVers", "sensitive"
];

// Map of valid scimType codes for each HTTP status code (where applicable)
const validCodeTypes = {400: validScimTypes.slice(2), 409: ["uniqueness"], 413: ["tooMany"]};

/**
 * SCIM Error Message Type
 * @alias SCIMMY.Messages.Error
 */
export class Error {
    /**
     * SCIM Error Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:Error";
    
    /**
     * Instantiate a new SCIM Error Message with relevant details
     * @constructs SCIMMY.Messages.Error
     * @param {Object} ex - the initiating exception to parse into a SCIM error message
     * @param {Number} ex.status - HTTP status code to be sent with the error
     * @param {String} ex.scimType - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @param {String} ex.detail - a human-readable description of what caused the error to occur
     */
    constructor(ex) {
        // Dereference parts of the exception
        let {status = 500, scimType, message: detail} = ex;
        
        // TODO: rethrow parsed error responses
        // Validate the supplied parameters
        if (!validStatusCodes.includes(Number(status)))
            throw new TypeError(`Incompatible HTTP status code '${status}' supplied to SCIM Error Message constructor`);
        if (!!scimType && !validScimTypes.includes(scimType))
            throw new TypeError(`Unknown detail error keyword '${scimType}' supplied to SCIM Error Message constructor`);
        if (!!scimType && !validCodeTypes[Number(status)].includes(scimType))
            throw new TypeError(`HTTP status code '${Number(status)}' not valid for detail error keyword '${scimType}' in SCIM Error Message constructor`);
        
        // No exceptions thrown, assign the parameters to the instance
        this.schemas = [Error.#id];
        this.status = String(status);
        if (!!scimType) this.scimType = scimType;
        this.detail = detail;
    }
}