import {Schema, SchemaDefinition, Attribute} from "../types.js";

/**
 * SCIM Service Provider Configuration Schema
 * @implements {Schema}
 */
export class ServiceProviderConfig extends Schema {
    /** @implements {Schema~definition} */
    static get definition() {
        return ServiceProviderConfig.#definition;
    }
    
    /** @implements {Schema~#definition} */
    static #definition = new SchemaDefinition(
        "ServiceProviderConfig", "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig",
        "Schema for representing the service provider's configuration", [
            new Attribute("reference", "documentationUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the service provider's human-consumable help documentation."}),
            new Attribute("complex", "patch", {required: true, mutable: false, description: "A complex type that specifies PATCH configuration options."}, [
                new Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Attribute("complex", "bulk", {required: true, mutable: false, description: "A complex type that specifies bulk configuration options."}, [
                new Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."}),
                new Attribute("integer", "maxOperations", {required: true, mutable: false, description: "An integer value specifying the maximum number of operations."}),
                new Attribute("integer", "maxPayloadSize", {required: true, mutable: false, description: "An integer value specifying the maximum payload size in bytes."})
            ]),
            new Attribute("complex", "filter", {required: true, mutable: false, description: "A complex type that specifies FILTER options."}, [
                new Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."}),
                new Attribute("integer", "maxResults", {required: true, mutable: false, description: "An integer value specifying the maximum number of resources returned in a response."})
            ]),
            new Attribute("complex", "changePassword", {required: true, mutable: false, description: "A complex type that specifies configuration options related to changing a password."}, [
                new Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Attribute("complex", "sort", {required: true, mutable: false, description: "A complex type that specifies sort result options."}, [
                new Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Attribute("complex", "authenticationSchemes", {required: true, mutable: false, multiValued: true, description: "A complex type that specifies supported authentication scheme properties."}, [
                new Attribute("string", "name", {required: true, mutable: false, description: "The common authentication scheme name, e.g., HTTP Basic."}),
                new Attribute("string", "description", {required: true, mutable: false, description: "A description of the authentication scheme."}),
                new Attribute("reference", "specUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the authentication scheme's specification."}),
                new Attribute("reference", "documentationUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the authentication scheme's usage documentation."})
            ])
        ]
    // Remove ID attribute
    ).truncate("id");
    
    /**
     * Instantiates a new service provider configuration that conforms to the SCIM ServiceProviderConfig schema definition
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [basepath] - the base path for resolution of a resource's location
     */
    constructor(resource, basepath) {
        super(resource, "out");
        Object.assign(this, ServiceProviderConfig.#definition.coerce(resource, "out", basepath));
    }
}