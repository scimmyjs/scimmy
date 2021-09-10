import {Schema, SchemaDefinition, Attribute} from "../types.js";

/**
 * SCIM EnterpriseUser Schema
 * @implements {Schema}
 */
export class EnterpriseUser extends Schema {
    /** @implements {Schema~definition} */
    static get definition() {
        return EnterpriseUser.#definition;
    }
    
    /** @implements {Schema~#definition} */
    static #definition = new SchemaDefinition("EnterpriseUser", "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User", "Enterprise User", [
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
    
    /**
     * Instantiates a new enterprise user that conforms to the SCIM EnterpriseUser schema definition
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     */
    constructor(resource, direction = "both", basepath) {
        super();
        this.schemas = [EnterpriseUser.#definition.id];
        Object.assign(this, EnterpriseUser.#definition.coerce(resource, direction, basepath));
    }
}