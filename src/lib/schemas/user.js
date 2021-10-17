import Types from "../types.js";

/**
 * SCIM User Schema
 * @alias SCIMMY.Schemas.User
 */
export class User extends Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return User.#definition;
    }
    
    /** @private */
    static #definition = new Types.SchemaDefinition("User", "urn:ietf:params:scim:schemas:core:2.0:User", "User Account", [
        new Types.Attribute("string", "userName", {required: true, uniqueness: "server"}),
        new Types.Attribute("complex", "name", {}, [
            new Types.Attribute("string", "formatted"),
            new Types.Attribute("string", "familyName"),
            new Types.Attribute("string", "givenName"),
            new Types.Attribute("string", "middleName"),
            new Types.Attribute("string", "honorificPrefix"),
            new Types.Attribute("string", "honorificSuffix")
        ]),
        new Types.Attribute("string", "displayName"),
        new Types.Attribute("string", "nickName"),
        new Types.Attribute("reference", "profileUrl", {referenceTypes: ["external"]}),
        new Types.Attribute("string", "title"),
        new Types.Attribute("string", "userType"),
        new Types.Attribute("string", "preferredLanguage"),
        new Types.Attribute("string", "locale"),
        new Types.Attribute("string", "timezone"),
        new Types.Attribute("boolean", "active"),
        new Types.Attribute("string", "password", {direction: "in", returned: false}),
        new Types.Attribute("complex", "emails", {multiValued: true}, [
            new Types.Attribute("string", "value"),
            new Types.Attribute("string", "display"),
            new Types.Attribute("string", "type", {canonicalValues: ["work", "home", "other"]}),
            new Types.Attribute("boolean", "primary")
        ]),
        new Types.Attribute("complex", "phoneNumbers", {multiValued: true, uniqueness: false}, [
            new Types.Attribute("string", "value"),
            new Types.Attribute("string", "display"),
            new Types.Attribute("string", "type", {canonicalValues: ["work", "home", "mobile", "fax", "pager", "other"]}),
            new Types.Attribute("boolean", "primary")
        ]),
        new Types.Attribute("complex", "ims", {multiValued: true, uniqueness: false}, [
            new Types.Attribute("string", "value"),
            new Types.Attribute("string", "display"),
            new Types.Attribute("string", "type", {canonicalValues: ["aim", "gtalk", "icq", "xmpp", "msn", "skype", "qq", "yahoo"]}),
            new Types.Attribute("boolean", "primary")
        ]),
        new Types.Attribute("complex", "photos", {multiValued: true, uniqueness: false}, [
            new Types.Attribute("reference", "value", {referenceTypes: ["external"]}),
            new Types.Attribute("string", "display"),
            new Types.Attribute("string", "type", {canonicalValues: ["photo", "thumbnail"]}),
            new Types.Attribute("boolean", "primary")
        ]),
        new Types.Attribute("complex", "addresses", {multiValued: true}, [
            new Types.Attribute("string", "formatted"),
            new Types.Attribute("string", "streetAddress"),
            new Types.Attribute("string", "locality"),
            new Types.Attribute("string", "region"),
            new Types.Attribute("string", "postalCode"),
            new Types.Attribute("string", "country"),
            new Types.Attribute("string", "type", {canonicalValues: ["work", "home", "other"]})
        ]),
        new Types.Attribute("complex", "groups", {direction: "out", mutable: false, multiValued: true, uniqueness: false}, [
            new Types.Attribute("string", "value", {direction: "out", mutable: false}),
            new Types.Attribute("reference", "$ref", {direction: "out", mutable: false, referenceTypes: ["User", "Group"]}),
            new Types.Attribute("string", "display", {direction: "out", mutable: false}),
            new Types.Attribute("string", "type", {direction: "out", mutable: false, canonicalValues: ["direct", "indirect"]})
        ]),
        new Types.Attribute("complex", "entitlements", {multiValued: true, uniqueness: false}, [
            new Types.Attribute("string", "value"),
            new Types.Attribute("string", "display"),
            new Types.Attribute("string", "type"),
            new Types.Attribute("boolean", "primary")
        ]),
        new Types.Attribute("complex", "roles", {multiValued: true, uniqueness: false}, [
            new Types.Attribute("string", "value"),
            new Types.Attribute("string", "display"),
            new Types.Attribute("string", "type", {canonicalValues: []}),
            new Types.Attribute("boolean", "primary")
        ]),
        new Types.Attribute("complex", "x509Certificates", {multiValued: true, uniqueness: false}, [
            new Types.Attribute("binary", "value"),
            new Types.Attribute("string", "display"),
            new Types.Attribute("string", "type", {canonicalValues: []}),
            new Types.Attribute("boolean", "primary")
        ])
    ]);
    
    /**
     * Instantiates a new user that conforms to the SCIM User schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
     */
    constructor(resource, direction = "both", basepath, filters) {
        super(resource, direction);
        Object.assign(this, User.#definition.coerce(resource, direction, basepath, filters));
    }
}