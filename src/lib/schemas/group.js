import Types from "../types.js";

/**
 * SCIM Group Schema
 * @alias SCIMMY.Schemas.Group
 * @summary
 * *   Ensures a Group instance conforms to the Group schema set out in [RFC7643§4.2](https://datatracker.ietf.org/doc/html/rfc7643#section-4.2).
 */
export class Group extends Types.Schema {
    /** @type {"urn:ietf:params:scim:schemas:core:2.0:Group"} */
    static get id() {
        return Group.#definition.id;
    }
    
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return Group.#definition;
    }
    
    /** @private */
    static #definition = new Types.SchemaDefinition("Group", "urn:ietf:params:scim:schemas:core:2.0:Group", "Group", [
        new Types.Attribute("string", "displayName", {required: true, description: "A human-readable name for the Group. REQUIRED."}),
        new Types.Attribute("complex", "members", {multiValued: true, uniqueness: false, description: "A list of members of the Group."}, [
            new Types.Attribute("string", "value", {mutable: "immutable", description: "Identifier of the member of this Group."}),
            new Types.Attribute("string", "display", {mutable: "immutable", description: "Human-readable name of the member of this Group."}),
            new Types.Attribute("reference", "$ref", {mutable: "immutable", referenceTypes: ["User", "Group"], description: "The URI corresponding to a SCIM resource that is a member of this Group."}),
            new Types.Attribute("string", "type", {mutable: "immutable", canonicalValues: ["User", "Group"], description: "A label indicating the type of resource, e.g., 'User' or 'Group'."})
        ])
    ]);
    
    /**
     * Instantiates a new group that conforms to the SCIM Group schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
     * @property {String} displayName - a human-readable name for the Group
     * @property {Object[]} [members] - a list of members of the Group
     * @property {String} members[].value - identifier of the member of this Group
     * @property {String} [members[].display] - human-readable name of the member of this Group
     * @property {String} [members[].$ref] - the URI corresponding to a SCIM resource that is a member of this Group
     * @property {String} [members[].type] - a label indicating the type of resource, e.g., 'User' or 'Group'
     */
    constructor(resource, direction = "both", basepath, filters) {
        super(resource, direction);
        Object.assign(this, Group.#definition.coerce(resource, direction, basepath, filters));
    }
}