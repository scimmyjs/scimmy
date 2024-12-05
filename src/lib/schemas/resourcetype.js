import Types from "../types.js";

/**
 * SCIM ResourceType Schema
 * @alias SCIMMY.Schemas.ResourceType
 * @summary
 * *   Ensures a ResourceType instance conforms to the ResourceType schema set out in [RFC7643§6](https://datatracker.ietf.org/doc/html/rfc7643#section-6).
 */
export class ResourceType extends Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return ResourceType.#definition;
    }
    
    /** @private */
    static #definition = (() => {
        let definition = new Types.SchemaDefinition("ResourceType", "urn:ietf:params:scim:schemas:core:2.0:ResourceType", "Specifies the schema that describes a SCIM resource type", [
            new Types.Attribute("string", "name", {direction: "out", required: true, mutable: false, description: "The resource type name. When applicable, service providers MUST specify the name, e.g., 'User'."}),
            new Types.Attribute("string", "description", {direction: "out", mutable: false, description: "The resource type's human-readable description. When applicable, service providers MUST specify the description."}),
            new Types.Attribute("reference", "endpoint", {direction: "out", required: true, mutable: false, referenceTypes: ["uri"], description: "The resource type's HTTP-addressable endpoint relative to the Base URL, e.g., '/Users'."}),
            new Types.Attribute("reference", "schema", {direction: "out", required: true, mutable: false, caseExact: true, referenceTypes: ["uri"], description: "The resource type's primary/base schema URI."}),
            new Types.Attribute("complex", "schemaExtensions", {direction: "out", mutable: false, multiValued: true, uniqueness: false, description: "A list of URIs of the resource type's schema extensions."}, [
                new Types.Attribute("reference", "schema", {direction: "out", required: true, mutable: false, caseExact: true, referenceTypes: ["uri"], description: "The URI of a schema extension."}),
                new Types.Attribute("boolean", "required", {direction: "out", required: true, mutable: false, description: "A Boolean value that specifies whether or not the schema extension is required for the resource type. If true, a resource of this type MUST include this schema extension and also include any attributes declared as required in this schema extension. If false, a resource of this type MAY omit this schema extension."})
            ])
        ]);
        
        // Make the ID attribute visible!
        Object.assign(definition.attribute("id").config, {
            shadow: false, required: false, returned: true, caseExact: false, uniqueness: "none",
            description: "The resource type's server unique id. May be the same as the 'name' attribute."
        });
        
        return definition;
    })();
    
    /**
     * Instantiates a new resource type that conforms to the SCIM ResourceType schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [basepath] - the base path for resolution of a resource's location
     * @property {String} name - the resource type name. When applicable, service providers MUST specify the name, e.g., 'User'
     * @property {String} [description] - the resource type's human-readable description. When applicable, service providers MUST specify the description
     * @property {String} endpoint - the resource type's HTTP-addressable endpoint relative to the Base URL, e.g., '/Users'
     * @property {String} schema - the resource type's primary/base schema URI
     * @property {Object[]} [schemaExtensions] - a list of URIs of the resource type's schema extensions
     * @property {String} schemaExtensions[].schema - the URI of a schema extension
     * @property {Boolean} schemaExtensions[].required - a Boolean value that specifies whether the schema extension is required for the resource type
     */
    constructor(resource, basepath) {
        super(resource, "out");
        Object.assign(this, ResourceType.#definition.coerce(resource, "out", basepath));
    }
}