import Types from "../types.js";

/**
 * SCIM Service Provider Configuration Schema
 * @alias SCIMMY.Schemas.ServiceProviderConfig
 */
export class ServiceProviderConfig extends Types.Schema {
    /**
     * @static
     * @alias definition
     * @memberOf SCIMMY.Schemas.ServiceProviderConfig
     * @implements {SCIMMY.Types.Schema.definition}
     */
    static get definition() {
        return ServiceProviderConfig.#definition;
    }
    
    /** @private */
    static #definition = new Types.SchemaDefinition(
        "ServiceProviderConfig", "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig",
        "Schema for representing the service provider's configuration", [
            new Types.Attribute("reference", "documentationUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the service provider's human-consumable help documentation."}),
            new Types.Attribute("complex", "patch", {required: true, mutable: false, description: "A complex type that specifies PATCH configuration options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Types.Attribute("complex", "bulk", {required: true, mutable: false, description: "A complex type that specifies bulk configuration options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."}),
                new Types.Attribute("integer", "maxOperations", {required: true, mutable: false, description: "An integer value specifying the maximum number of operations."}),
                new Types.Attribute("integer", "maxPayloadSize", {required: true, mutable: false, description: "An integer value specifying the maximum payload size in bytes."})
            ]),
            new Types.Attribute("complex", "filter", {required: true, mutable: false, description: "A complex type that specifies FILTER options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."}),
                new Types.Attribute("integer", "maxResults", {required: true, mutable: false, description: "An integer value specifying the maximum number of resources returned in a response."})
            ]),
            new Types.Attribute("complex", "changePassword", {required: true, mutable: false, description: "A complex type that specifies configuration options related to changing a password."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Types.Attribute("complex", "sort", {required: true, mutable: false, description: "A complex type that specifies sort result options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Types.Attribute("complex", "etag", {required: true, mutable: false, description: "A complex type that specifies ETag configuration options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Types.Attribute("complex", "authenticationSchemes", {required: true, mutable: false, multiValued: true, description: "A complex type that specifies supported authentication scheme properties."}, [
                new Types.Attribute("string", "type", {required: true, mutable: false, canonicalValues: ["oauth", "oauth2", "oauthbearertoken", "httpbasic", "httpdigest"], description: "The authentication scheme."}),
                new Types.Attribute("string", "name", {required: true, mutable: false, description: "The common authentication scheme name, e.g., HTTP Basic."}),
                new Types.Attribute("string", "description", {required: true, mutable: false, description: "A description of the authentication scheme."}),
                new Types.Attribute("reference", "specUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the authentication scheme's specification."}),
                new Types.Attribute("reference", "documentationUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the authentication scheme's usage documentation."})
            ])
        ]
    // Remove ID attribute
    ).truncate("id");
    
    /**
     * Instantiates a new service provider configuration that conforms to the SCIM ServiceProviderConfig schema definition
     * @constructs SCIMMY.Schemas.ServiceProviderConfig
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [basepath] - the base path for resolution of a resource's location
     */
    constructor(resource, basepath) {
        super(resource, "out");
        Object.assign(this, ServiceProviderConfig.#definition.coerce(resource, "out", basepath));
    }
}