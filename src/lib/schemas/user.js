import Types from "../types.js";

/**
 * SCIM User Schema
 * @alias SCIMMY.Schemas.User
 * @summary
 * *   Ensures a User instance conforms to the User schema set out in [RFC7643§4.1](https://datatracker.ietf.org/doc/html/rfc7643#section-4.1).
 */
export class User extends Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return User.#definition;
    }
    
    /** @private */
    static #definition = new Types.SchemaDefinition("User", "urn:ietf:params:scim:schemas:core:2.0:User", "User Account", [
        new Types.Attribute("string", "userName", {required: true, uniqueness: "server", description: "Unique identifier for the User, typically used by the user to directly authenticate to the service provider. Each User MUST include a non-empty userName value. This identifier MUST be unique across the service provider's entire set of Users. REQUIRED."}),
        new Types.Attribute("complex", "name", {description: "The components of the user's real name. Providers MAY return just the full name as a single string in the formatted sub-attribute, or they MAY return just the individual component attributes using the other sub-attributes, or they MAY return both. If both variants are returned, they SHOULD be describing the same name, with the formatted name indicating how the component attributes should be combined."}, [
            new Types.Attribute("string", "formatted", {description: "The full name, including all middle names, titles, and suffixes as appropriate, formatted for display (e.g. 'Ms. Barbara J Jensen, III')."}),
            new Types.Attribute("string", "familyName", {description: "The family name of the User, or last name in most Western languages (e.g. 'Jensen' given the full name 'Ms. Barbara J Jensen, III')."}),
            new Types.Attribute("string", "givenName", {description: "The given name of the User, or first name in most Western languages (e.g. 'Barbara' given the full name 'Ms. Barbara J Jensen, III')."}),
            new Types.Attribute("string", "middleName", {description: "The middle name(s) of the User (e.g. 'Jane' given the full name 'Ms. Barbara J Jensen, III')."}),
            new Types.Attribute("string", "honorificPrefix", {description: "The honorific prefix(es) of the User, or title in most Western languages (e.g. 'Ms.' given the full name 'Ms. Barbara J Jensen, III')."}),
            new Types.Attribute("string", "honorificSuffix", {description: "The honorific suffix(es) of the User, or suffix in most Western languages (e.g. 'III' given the full name 'Ms. Barbara J Jensen, III')."})
        ]),
        new Types.Attribute("string", "displayName", {description: "The name of the User, suitable for display to end-users. The name SHOULD be the full name of the User being described, if known."}),
        new Types.Attribute("string", "nickName", {description: "The casual way to address the user in real life, e.g. 'Bob' or 'Bobby' instead of 'Robert'. This attribute SHOULD NOT be used to represent a User's username (e.g. 'bjensen' or 'mpepperidge')."}),
        new Types.Attribute("reference", "profileUrl", {referenceTypes: ["external"], description: "A fully qualified URL pointing to a page representing the User's online profile."}),
        new Types.Attribute("string", "title", {description: "The user's title, such as 'Vice President'."}),
        new Types.Attribute("string", "userType", {description: "Used to identify the relationship between the organization and the user. Typical values used might be 'Contractor', 'Employee', 'Intern', 'Temp', 'External', and 'Unknown', but any value may be used."}),
        new Types.Attribute("string", "preferredLanguage", {description: "Indicates the User's preferred written or spoken language. Generally used for selecting a localized user interface; e.g. 'en_US' specifies the language English and country US."}),
        new Types.Attribute("string", "locale", {description: "Used to indicate the User's default location for purposes of localizing items such as currency, date time format, or numerical representations."}),
        new Types.Attribute("string", "timezone", {description: "The User's time zone in the 'Olson' time zone database format, e.g. 'America/Los_Angeles'."}),
        new Types.Attribute("boolean", "active", {description: "A Boolean value indicating the User's administrative status."}),
        new Types.Attribute("string", "password", {direction: "in", returned: false, description: "The User's cleartext password. This attribute is intended to be used as a means to specify an initial password when creating a new User or to reset an existing User's password."}),
        new Types.Attribute("complex", "emails", {multiValued: true, description: "Email addresses for the user. The value SHOULD be canonicalized by the service provider, e.g. 'bjensen@example.com' instead of 'bjensen@EXAMPLE.COM'. Canonical type values of 'work', 'home', and 'other'."}, [
            new Types.Attribute("string", "value", {description: "Email addresses for the user. The value SHOULD be canonicalized by the service provider, e.g. 'bjensen@example.com' instead of 'bjensen@EXAMPLE.COM'. Canonical type values of 'work', 'home', and 'other'."}),
            new Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new Types.Attribute("string", "type", {canonicalValues: ["work", "home", "other"], description: "A label indicating the attribute's function, e.g. 'work' or 'home'."}),
            new Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute, e.g. the preferred mailing address or primary email address. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new Types.Attribute("complex", "phoneNumbers", {multiValued: true, uniqueness: false, description: "Phone numbers for the User. The value SHOULD be canonicalized by the service provider according to the format specified in RFC 3966, e.g. 'tel:+1-201-555-0123'. Canonical type values of 'work', 'home', 'mobile', 'fax', 'pager', and 'other'."}, [
            new Types.Attribute("string", "value", {description: "Phone number of the User."}),
            new Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new Types.Attribute("string", "type", {canonicalValues: ["work", "home", "mobile", "fax", "pager", "other"], description: "A label indicating the attribute's function, e.g. 'work', 'home', 'mobile'."}),
            new Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute, e.g. the preferred phone number or primary phone number. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new Types.Attribute("complex", "ims", {multiValued: true, uniqueness: false, description: "Instant messaging addresses for the User."}, [
            new Types.Attribute("string", "value", {description: "Instant messaging address for the User."}),
            new Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new Types.Attribute("string", "type", {canonicalValues: ["aim", "gtalk", "icq", "xmpp", "msn", "skype", "qq", "yahoo"], description: "A label indicating the attribute's function, e.g. 'aim', 'gtalk', 'xmpp'."}),
            new Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute, e.g. the preferred messenger or primary messenger. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new Types.Attribute("complex", "photos", {multiValued: true, uniqueness: false, description: "URLs of photos of the User."}, [
            new Types.Attribute("reference", "value", {referenceTypes: ["external"], description: "URL of a photo of the User."}),
            new Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new Types.Attribute("string", "type", {canonicalValues: ["photo", "thumbnail"], description: "A label indicating the attribute's function, i.e., 'photo' or 'thumbnail'."}),
            new Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute, e.g. the preferred photo or thumbnail. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new Types.Attribute("complex", "addresses", {multiValued: true, description: "A physical mailing address for this User. Canonical type values of 'work', 'home', and 'other'. This attribute is a complex type with the following sub-attributes."}, [
            new Types.Attribute("string", "formatted", {description: "The full mailing address, formatted for display or use with a mailing label. This attribute MAY contain newlines."}),
            new Types.Attribute("string", "streetAddress", {description: "The full street address component, which may include house number, street name, P.O. box, and multi-line extended street address information. This attribute MAY contain newlines."}),
            new Types.Attribute("string", "locality", {description: "The city or locality component."}),
            new Types.Attribute("string", "region", {description: "The state or region component."}),
            new Types.Attribute("string", "postalCode", {description: "The zip code or postal code component."}),
            new Types.Attribute("string", "country", {description: "The country name component."}),
            new Types.Attribute("string", "type", {canonicalValues: ["work", "home", "other"], description: "A label indicating the attribute's function, e.g. 'work' or 'home'."})
        ]),
        new Types.Attribute("complex", "groups", {direction: "out", mutable: false, multiValued: true, uniqueness: false, description: "A list of groups to which the user belongs, either through direct membership, through nested groups, or dynamically calculated."}, [
            new Types.Attribute("string", "value", {direction: "out", mutable: false, description: "The identifier of the User's group."}),
            new Types.Attribute("reference", "$ref", {direction: "out", mutable: false, referenceTypes: ["User", "Group"], description: "The URI of the corresponding 'Group' resource to which the user belongs."}),
            new Types.Attribute("string", "display", {direction: "out", mutable: false, description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new Types.Attribute("string", "type", {direction: "out", mutable: false, canonicalValues: ["direct", "indirect"], description: "A label indicating the attribute's function, e.g. 'direct' or 'indirect'."})
        ]),
        new Types.Attribute("complex", "entitlements", {multiValued: true, uniqueness: false, description: "A list of entitlements for the User that represent a thing the User has."}, [
            new Types.Attribute("string", "value", {description: "The value of an entitlement."}),
            new Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new Types.Attribute("string", "type", {description: "A label indicating the attribute's function."}),
            new Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new Types.Attribute("complex", "roles", {multiValued: true, uniqueness: false, description: "A list of roles for the User that collectively represent who the User is, e.g. 'Student', 'Faculty'."}, [
            new Types.Attribute("string", "value", {description: "The value of a role."}),
            new Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new Types.Attribute("string", "type", {canonicalValues: [], description: "A label indicating the attribute's function."}),
            new Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new Types.Attribute("complex", "x509Certificates", {multiValued: true, uniqueness: false, description: "A list of certificates issued to the User."}, [
            new Types.Attribute("binary", "value", {description: "The value of an X.509 certificate."}),
            new Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new Types.Attribute("string", "type", {canonicalValues: [], description: "A label indicating the attribute's function."}),
            new Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute. The primary attribute value 'true' MUST appear no more than once."})
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