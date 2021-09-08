export class SCIMError extends Error {
    constructor(status, scimType, message) {
        super(message);
        
        this.status = status;
        this.scimType = scimType;
    }
}