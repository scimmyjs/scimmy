import Types from "../types.js";

/**
 * SCIM Service Provider Configuration Schema
 * @alias SCIMMY.Schemas.ServiceProviderConfig
 * @summary
 * *   Ensures a ServiceProviderConfig instance conforms to the Service Provider Configuration schema set out in [RFC7643§5](https://datatracker.ietf.org/doc/html/rfc7643#section-5).
 */
export class ServiceProviderConfig extends Types.Schema {
    /** @type {"urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"} */
    static get id() {
        return ServiceProviderConfig.#definition.id;
    }
    
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return ServiceProviderConfig.#definition;
    }
    
    /** @private */
    static #definition = new Types.SchemaDefinition(
        "ServiceProviderConfig", "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig", "Schema for representing the service provider's configuration", [
            new Types.Attribute("reference", "documentationUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the service provider's human-consumable help documentation."}),
            new Types.Attribute("complex", "patch", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies PATCH configuration options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Types.Attribute("complex", "bulk", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies bulk configuration options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."}),
                new Types.Attribute("integer", "maxOperations", {required: true, mutable: false, description: "An integer value specifying the maximum number of operations."}),
                new Types.Attribute("integer", "maxPayloadSize", {required: true, mutable: false, description: "An integer value specifying the maximum payload size in bytes."})
            ]),
            new Types.Attribute("complex", "filter", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies FILTER options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."}),
                new Types.Attribute("integer", "maxResults", {required: true, mutable: false, description: "An integer value specifying the maximum number of resources returned in a response."})
            ]),
            new Types.Attribute("complex", "changePassword", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies configuration options related to changing a password."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Types.Attribute("complex", "sort", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies sort result options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Types.Attribute("complex", "etag", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies ETag configuration options."}, [
                new Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new Types.Attribute("complex", "authenticationSchemes", {required: true, mutable: false, multiValued: true, uniqueness: false, description: "A complex type that specifies supported authentication scheme properties."}, [
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
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [basepath] - the base path for resolution of a resource's location
     * @property {never} id
     * @property {String} documentationUri - an HTTP-addressable URL pointing to the service provider's human-consumable help documentation
     * @property {Object} patch - a complex type that specifies PATCH configuration options
     * @property {Boolean} patch.supported - a Boolean value specifying whether the operation is supported
     * @property {Object} bulk - a complex type that specifies bulk configuration options
     * @property {Boolean} bulk.supported - a Boolean value specifying whether the operation is supported
     * @property {Number} bulk.maxOperations - an integer value specifying the maximum number of operations
     * @property {Number} bulk.maxPayloadSize - an integer value specifying the maximum payload size in bytes
     * @property {Object} filter - a complex type that specifies FILTER options
     * @property {Boolean} filter.supported - a Boolean value specifying whether the operation is supported
     * @property {Number} filter.maxResults - an integer value specifying the maximum number of resources returned in a response
     * @property {Object} changePassword - a complex type that specifies configuration options related to changing a password
     * @property {Boolean} changePassword.supported - a Boolean value specifying whether the operation is supported
     * @property {Object} sort - a complex type that specifies sort result options
     * @property {Boolean} sort.supported - a Boolean value specifying whether the operation is supported
     * @property {Object} etag - a complex type that specifies ETag configuration options
     * @property {Boolean} etag.supported - a Boolean value specifying whether the operation is supported
     * @property {Object[]} authenticationSchemes - a complex type that specifies supported authentication scheme properties
     * @property {String} authenticationSchemes[].type - the authentication scheme
     * @property {String} authenticationSchemes[].name - the common authentication scheme name, e.g., HTTP Basic
     * @property {String} authenticationSchemes[].description - a description of the authentication scheme
     * @property {String} [authenticationSchemes[].specUri] - an HTTP-addressable URL pointing to the authentication scheme's specification
     * @property {String} [authenticationSchemes[].documentationUri] - an HTTP-addressable URL pointing to the authentication scheme's usage documentation
     */
    constructor(resource, basepath) {
        super(resource, "out");
        Object.assign(this, ServiceProviderConfig.#definition.coerce(resource, "out", basepath));
    }
}