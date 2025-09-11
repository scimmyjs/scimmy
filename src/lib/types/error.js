/**
 * SCIM Error Type
 * @alias SCIMMY.Types.SCIMError
 * @alias SCIMMY.Types.Error
 * @see SCIMMY.Messages.ErrorResponse
 * @summary
 * *   Extends the native Error class and provides a way to express errors caused by SCIM protocol, schema conformity, filter expression,
 *     or other exceptions with details required by the SCIM protocol in [RFC7644§3.12](https://datatracker.ietf.org/doc/html/rfc7644#section-3.12).
 */
export class SCIMError extends Error {
    /**
     * Instantiate a new error with SCIM error details
     * @param {SCIMMY.Messages.ErrorResponse~ValidStatusCodes} status - HTTP status code to be sent with the error
     * @param {SCIMMY.Messages.ErrorResponse~ValidScimTypes|null} scimType - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @param {String} message - a human-readable description of what caused the error to occur
     * @property {SCIMMY.Messages.ErrorResponse~ValidStatusCodes} status - HTTP status code to be sent with the error
     * @property {SCIMMY.Messages.ErrorResponse~ValidScimTypes|null} scimType - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @property {String} message - a human-readable description of what caused the error to occur
     */
    constructor(status, scimType, message) {
        super(message);
        
        this.name = "SCIMError";
        this.status = status;
        this.scimType = scimType;
    }
}