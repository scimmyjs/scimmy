import {Schema, SchemaDefinition, Attribute} from "../types.js";

/**
 * SCIM User Schema
 * @implements {Schema}
 */
export class User extends Schema {
    /** @implements {Schema~schema} */
    static get schema() {
        return User.#schema;
    }
    
    /** @implements {Schema~#schema} */
    static #schema = new SchemaDefinition("User", "urn:ietf:params:scim:schemas:core:2.0:User", "User Account", [
        new Attribute("string", "userName", {required: true, uniqueness: "server"}),
        new Attribute("complex", "name", {}, [
            new Attribute("string", "formatted"),
            new Attribute("string", "familyName"),
            new Attribute("string", "givenName"),
            new Attribute("string", "middleName"),
            new Attribute("string", "honorificPrefix"),
            new Attribute("string", "honorificSuffix")
        ]),
        new Attribute("string", "displayName"),
        new Attribute("string", "nickName"),
        new Attribute("reference", "profileUrl", {referenceTypes: ["external"]}),
        new Attribute("string", "title"),
        new Attribute("string", "userType"),
        new Attribute("string", "preferredLanguage"),
        new Attribute("string", "locale"),
        new Attribute("string", "timezone"),
        new Attribute("boolean", "active"),
        new Attribute("string", "password", {direction: "in", returned: false}),
        new Attribute("complex", "emails", {multiValued: true}, [
            new Attribute("string", "value"),
            new Attribute("string", "display"),
            new Attribute("string", "type", {canonicalValues: ["work", "home", "other"]}),
            new Attribute("boolean", "primary")
        ]),
        new Attribute("complex", "phoneNumbers", {multiValued: true, uniqueness: false}, [
            new Attribute("string", "value"),
            new Attribute("string", "display"),
            new Attribute("string", "type", {canonicalValues: ["work", "home", "mobile", "fax", "pager", "other"]}),
            new Attribute("boolean", "primary")
        ]),
        new Attribute("complex", "ims", {multiValued: true, uniqueness: false}, [
            new Attribute("string", "value"),
            new Attribute("string", "display"),
            new Attribute("string", "type", {canonicalValues: ["aim", "gtalk", "icq", "xmpp", "msn", "skype", "qq", "yahoo"]}),
            new Attribute("boolean", "primary")
        ]),
        new Attribute("complex", "photos", {multiValued: true, uniqueness: false}, [
            new Attribute("reference", "value", {referenceTypes: ["external"]}),
            new Attribute("string", "display"),
            new Attribute("string", "type", {canonicalValues: ["photo", "thumbnail"]}),
            new Attribute("boolean", "primary")
        ]),
        new Attribute("complex", "addresses", {multiValued: true}, [
            new Attribute("string", "formatted"),
            new Attribute("string", "streetAddress"),
            new Attribute("string", "locality"),
            new Attribute("string", "region"),
            new Attribute("string", "postalCode"),
            new Attribute("string", "country"),
            new Attribute("string", "type", {canonicalValues: ["work", "home", "other"]})
        ]),
        new Attribute("complex", "groups", {direction: "out", mutable: false, multiValued: true, uniqueness: false}, [
            new Attribute("string", "value", {direction: "out", mutable: false}),
            new Attribute("reference", "$ref", {direction: "out", mutable: false, referenceTypes: ["User", "Group"]}),
            new Attribute("string", "display", {direction: "out", mutable: false}),
            new Attribute("string", "type", {direction: "out", mutable: false, canonicalValues: ["direct", "indirect"]})
        ]),
        new Attribute("complex", "entitlements", {multiValued: true, uniqueness: false}, [
            new Attribute("string", "value"),
            new Attribute("string", "display"),
            new Attribute("string", "type"),
            new Attribute("boolean", "primary")
        ]),
        new Attribute("complex", "roles", {multiValued: true, uniqueness: false}, [
            new Attribute("string", "value"),
            new Attribute("string", "display"),
            new Attribute("string", "type", {canonicalValues: []}),
            new Attribute("boolean", "primary")
        ]),
        new Attribute("complex", "x509Certificates", {multiValued: true, uniqueness: false}, [
            new Attribute("binary", "value"),
            new Attribute("string", "display"),
            new Attribute("string", "type", {canonicalValues: []}),
            new Attribute("boolean", "primary")
        ])
    ]);
    
    /**
     * Instantiates a new user that conforms to the SCIM User schema definition
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     */
    constructor(resource, direction = "both", basepath) {
        super();
        this.schemas = [User.#schema.id];
        Object.assign(this, User.#schema.coerce(resource, direction, basepath));
    }
}