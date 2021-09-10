import {Schema, SchemaDefinition, Attribute} from "../types.js";

/**
 * SCIM ResourceType Schema
 * @implements {Schema}
 */
export class ResourceType extends Schema {
    /** @implements {Schema~definition} */
    static get definition() {
        return ResourceType.#definition;
    }
    
    /** @implements {Schema~#definition} */
    static #definition = new SchemaDefinition("ResourceType", "urn:ietf:params:scim:schemas:core:2.0:ResourceType", "Resource Type", [
        new Attribute("string", "id", {direction: "out", mutable: false}),
        new Attribute("string", "name", {direction: "out", required: true, mutable: false}),
        new Attribute("string", "description", {direction: "out", mutable: false}),
        new Attribute("reference", "endpoint", {direction: "out", required: true, mutable: false, referenceTypes: ["uri"]}),
        new Attribute("reference", "schema", {direction: "out", required: true, mutable: false, caseExact: true, referenceTypes: ["uri"]}),
        new Attribute("complex", "schemaExtensions", {direction: "out", mutable: false}, [
            new Attribute("reference", "schema", {direction: "out", required: true, mutable: false, caseExact: true, referenceTypes: ["uri"]}),
            new Attribute("boolean", "required", {direction: "out", required: true, mutable: false})
        ])
    ]);
    
    /**
     * Instantiates a new resource type that conforms to the SCIM ResourceType schema definition
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [basepath] - the base path for resolution of a resource's location
     */
    constructor(resource, basepath) {
        super();
        this.schemas = [ResourceType.#definition.id];
        Object.assign(this, ResourceType.#definition.coerce(resource, "out", basepath));
    }
}