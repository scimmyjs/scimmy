import Types from "../types.js";

/**
 * SCIM ResourceType Schema
 * @alias SCIMMY.Schemas.ResourceType
 */
export class ResourceType extends Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return ResourceType.#definition;
    }
    
    /** @private */
    static #definition = new Types.SchemaDefinition("ResourceType", "urn:ietf:params:scim:schemas:core:2.0:ResourceType", "Resource Type", [
        new Types.Attribute("string", "name", {direction: "out", required: true, mutable: false}),
        new Types.Attribute("string", "description", {direction: "out", mutable: false}),
        new Types.Attribute("reference", "endpoint", {direction: "out", required: true, mutable: false, referenceTypes: ["uri"]}),
        new Types.Attribute("reference", "schema", {direction: "out", required: true, mutable: false, caseExact: true, referenceTypes: ["uri"]}),
        new Types.Attribute("complex", "schemaExtensions", {direction: "out", mutable: false, multiValued: true}, [
            new Types.Attribute("reference", "schema", {direction: "out", required: true, mutable: false, caseExact: true, referenceTypes: ["uri"]}),
            new Types.Attribute("boolean", "required", {direction: "out", required: true, mutable: false})
        ])
    ]);
    
    /**
     * Instantiates a new resource type that conforms to the SCIM ResourceType schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [basepath] - the base path for resolution of a resource's location
     */
    constructor(resource, basepath) {
        super(resource, "out");
        Object.assign(this, ResourceType.#definition.coerce(resource, "out", basepath));
    }
}