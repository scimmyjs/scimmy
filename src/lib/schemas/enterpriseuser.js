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
        new Types.Attribute("string", "employeeNumber", {description: "Numeric or alphanumeric identifier assigned to a person, typically based on order of hire or association with an organization."}),
        new Types.Attribute("string", "costCenter", {description: "Identifies the name of a cost center."}),
        new Types.Attribute("string", "organization", {description: "Identifies the name of an organization."}),
        new Types.Attribute("string", "division", {description: "Identifies the name of a division."}),
        new Types.Attribute("string", "department", {description: "Identifies the name of a department."}),
        new Types.Attribute("complex", "manager", {uniqueness: false, description: "The User's manager.  A complex type that optionally allows service providers to represent organizational hierarchy by referencing the 'id' attribute of another User."}, [
            new Types.Attribute("string", "value", {description: "The id of the SCIM resource representing the User's manager."}),
            new Types.Attribute("reference", "$ref", {referenceTypes: ["User"], description: "The URI of the SCIM resource representing the User's manager."}),
            new Types.Attribute("string", "displayName", {mutable: false, description: "The displayName of the User's manager."})
        ])
    ]);
    
    /**
     * Instantiates a new enterprise user that conforms to the SCIM EnterpriseUser schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
     * @property {String} [employeeNumber] - numeric or alphanumeric identifier assigned to a person, typically based on order of hire or association with an organization
     * @property {String} [costCenter] - identifies the name of a cost center
     * @property {String} [organization] - identifies the name of an organization
     * @property {String} [division] - identifies the name of a division
     * @property {String} [department] - identifies the name of a department
     * @property {Object} [manager] - the User's manager
     * @property {String} manager.value - the id of the SCIM resource representing the User's manager
     * @property {String} [manager.$ref] - the URI of the SCIM resource representing the User's manager
     * @property {String} [manager.displayName] - the displayName of the User's manager
     */
    constructor(resource, direction = "both", basepath, filters) {
        super(resource, direction);
        Object.assign(this, EnterpriseUser.#definition.coerce(resource, direction, basepath, filters));
    }
}