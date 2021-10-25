import Types from "../types.js";

/**
 * SCIM EnterpriseUser Schema
 * @alias SCIMMY.Schemas.EnterpriseUser
 * @summary
 * *   Ensures an EnterpriseUser instance conforms to the EnterpriseUser schema extension set out in [RFC7643§4.3](https://datatracker.ietf.org/doc/html/rfc7643#section-4.3).
 * *   Can be used directly, but is typically used to extend the `SCIMMY.Schemas.User` schema definition.
 */
export class EnterpriseUser extends Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return EnterpriseUser.#definition;
    }
    
    /** @private */
    static #definition = new Types.SchemaDefinition("EnterpriseUser", "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User", "Enterprise User", [
        new Types.Attribute("string", "employeeNumber"),
        new Types.Attribute("string", "costCenter"),
        new Types.Attribute("string", "organization"),
        new Types.Attribute("string", "division"),
        new Types.Attribute("string", "department"),
        new Types.Attribute("complex", "manager", {uniqueness: false}, [
            new Types.Attribute("string", "value", {required: true}),
            new Types.Attribute("reference", "$ref", {referenceTypes: ["User"]}),
            new Types.Attribute("string", "displayName", {mutable: false})
        ])
    ]);
    
    /**
     * Instantiates a new enterprise user that conforms to the SCIM EnterpriseUser schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
     */
    constructor(resource, direction = "both", basepath, filters) {
        super(resource, direction);
        Object.assign(this, EnterpriseUser.#definition.coerce(resource, direction, basepath, filters));
    }
}