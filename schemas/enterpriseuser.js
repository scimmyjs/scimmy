import {Schema, Attribute} from "../types.js";

export class EnterpriseUser {
    static get schema() {
        return EnterpriseUser.#schema;
    }
    
    static #schema = new Schema("EnterpriseUser", "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User", "Enterprise User", [
        new Attribute("string", "employeeNumber"),
        new Attribute("string", "costCenter"),
        new Attribute("string", "organization"),
        new Attribute("string", "division"),
        new Attribute("string", "department"),
        new Attribute("complex", "manager", {uniqueness: false}, [
            new Attribute("string", "value", {required: true}),
            new Attribute("reference", "$ref", {referenceTypes: ["User"]}),
            new Attribute("string", "displayName", {mutable: false})
        ])
    ]);
    
    constructor(resource, direction = "both", basepath) {
        this.schemas = [EnterpriseUser.#schema.id];
        Object.assign(this, EnterpriseUser.#schema.coerce(resource, direction, basepath));
    }
}