import Types from "../types.js";

/**
 * HTTP response status codes specified by RFC7644§3.12
 * @enum SCIMMY.Messages.ErrorResponse~ValidStatusCodes
 * @inner
 */
const validStatusCodes = [307, 308, 400, 401, 403, 404, 409, 412, 413, 500, 501];

/**
 * SCIM detail error keywords specified by RFC7644§3.12
 * @enum SCIMMY.Messages.ErrorResponse~ValidScimTypes
 * @inner
 */
const validScimTypes = [
    "uniqueness", "tooMany", "invalidFilter", "mutability", "invalidSyntax",
    "invalidPath", "noTarget", "invalidValue", "invalidVers", "sensitive"
];

// Map of valid scimType codes for each HTTP status code (where applicable)
const validCodeTypes = {400: validScimTypes.slice(2), 409: ["uniqueness"], 413: ["tooMany"]};

/**
 * SCIM Error Message
 * @alias SCIMMY.Messages.ErrorResponse
 * @summary
 * *   Formats exceptions to conform to the [HTTP Status and Error Response Handling](https://datatracker.ietf.org/doc/html/rfc7644#section-3.12) section of the SCIM protocol, ensuring HTTP status codes and scimType error detail keyword pairs are valid.
 * *   When used to parse service provider responses, throws a new instance of `SCIMMY.Types.Error` with details sourced from the message.
 */
export class ErrorResponse extends Error {
    /**
     * SCIM Error Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:Error";
    
    /**
     * Instantiate a new SCIM Error Message with relevant details
     * @param {Object} [ex={}] - the initiating exception to parse into a SCIM error message
     * @param {SCIMMY.Messages.ErrorResponse~ValidStatusCodes} [ex.status=500] - HTTP status code to be sent with the error
     * @param {SCIMMY.Messages.ErrorResponse~ValidScimTypes} [ex.scimType] - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @param {String} [ex.detail] - a human-readable description of what caused the error to occur
     * @property {SCIMMY.Messages.ErrorResponse~ValidStatusCodes} status - stringified HTTP status code to be sent with the error
     * @property {SCIMMY.Messages.ErrorResponse~ValidScimTypes} [scimType] - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @property {String} [detail] - a human-readable description of what caused the error to occur
     */
    constructor(ex = {}) {
        // Dereference parts of the exception
        const {schemas = [], status = 500, scimType, message, detail = message} = ex;
        const errorSuffix = "SCIM Error Message constructor";
        
        super(message, {cause: ex});
        
        // Rethrow SCIM Error messages when error message schema ID is present
        if (schemas.includes(ErrorResponse.#id))
            throw new Types.Error(status, scimType, detail);
        // Validate the supplied parameters
        if (!validStatusCodes.includes(Number(status)))
            throw new TypeError(`Incompatible HTTP status code '${status}' supplied to ${errorSuffix}`);
        if (!!scimType && !validScimTypes.includes(scimType))
            throw new TypeError(`Unknown detail error keyword '${scimType}' supplied to ${errorSuffix}`);
        if (!!scimType && !validCodeTypes[Number(status)]?.includes(scimType))
            throw new TypeError(`HTTP status code '${Number(status)}' not valid for detail error keyword '${scimType}' in ${errorSuffix}`);
        
        // No exceptions thrown, assign the parameters to the instance
        this.schemas = [ErrorResponse.#id];
        this.status = String(status);
        if (!!scimType) this.scimType = String(scimType);
        if (!!detail) this.detail = detail;
    }
}