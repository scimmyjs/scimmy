export class PatchOp {
    constructor(operations = []) {
        this.schemas = ["urn:ietf:params:scim:api:messages:2.0:PatchOp"];
        this.Operations = operations;
    }
}