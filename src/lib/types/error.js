/**
 * SCIM Error
 * @class SCIMMY.Types.Error
 * @extends {Error}
 */
export class SCIMError extends Error {
    /**
     * Instantiate a new error with SCIM error details
     * @param {Number} status - HTTP status code to be sent with the error
     * @param {String} scimType - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @param {String} message - a human-readable description of what caused the error to occur
     */
    constructor(status, scimType, message) {
        super(message);
        
        this.status = status;
        this.scimType = scimType;
    }
}