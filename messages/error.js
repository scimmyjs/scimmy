export class Error {
    constructor(status, scimType, detail) {
        this.schemas = ["urn:ietf:params:scim:api:messages:2.0:Error"];
        this.status = status;
        this.detail = detail;
        if (!!scimType) this.scimType = scimType;
    }
}