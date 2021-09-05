/**
 * Collection of valid attribute type characteristic's values
 * @type {string[]}
 */
const type = [
    "string",
    "complex",
    "boolean",
    "decimal",
    "integer",
    "dateTime",
    "reference"
];

/**
 * Collection of valid attribute mutability characteristic's values
 * @type {string[]}
 */
const mutability = [
    "readOnly",
    "readWrite",
    "immutable",
    "writeOnly"
];

/**
 * Collection of valid attribute returned characteristic's values
 * @type {string[]}
 */
const returned = [
    "always",
    "never",
    "default",
    "request"
];

/**
 * Collection of valid attribute uniqueness characteristic's values
 * @type {string[]}
 */
const uniqueness = [
    "none",
    "server",
    "global"
];

/**
 * SCIM Attribute
 */
export class Attribute {
    /**
     * Constructs an instance of a full SCIM attribute definition
     * @param {String} type - the data type of the attribute
     * @param {String} name - the actual name of the attribute
     * @param {Object} [config] - additional config defining the attribute's characteristics
     * @param {Boolean} [config.multiValued=false] - does the attribute expect a collection of values
     * @param {String} [config.description=""] - a human-readable description of the attribute
     * @param {Boolean} [config.required=false] - whether the attribute is required for the type instance to be valid
     * @param {Boolean|String[]} [config.canonicalValues=false] - values the attribute's contents must be set to
     * @param {Boolean} [config.caseExact=false] - whether the attribute's contents is case sensitive
     * @param {Boolean|String} [config.mutable=true] - whether the attribute's contents is modifiable
     * @param {Boolean|String} [config.returned=true] - whether the attribute is returned in a response
     * @param {Boolean} [config.required=false] - whether or not the attribute is required for the type instance to be valid
     * @param {Boolean} [config.required=false] - whether or not the attribute is required for the type instance to be valid
     * @param {Boolean} [config.required=false] - whether or not the attribute is required for the type instance to be valid
     * @param {Attribute[]} [subAttributes] - if the attribute is complex, the sub-attributes of the attribute
     */
    constructor(type, name, config = {}, subAttributes = []) {
        this.type = type;
        this.name = name;
        this.config = {
            required: false, mutable: true, multiValued: false, caseExact: false, returned: true,
            description: "", canonicalValues: false, referenceTypes: false, uniqueness: "none", direction: "both",
            ...config
        };
        
        if (type === "complex") this.subAttributes = [...subAttributes];
    }
    
    /**
     * Parse this Attribute instance into a valid SCIM attribute definition object
     * @returns {AttributeDefinition} an object representing a valid SCIM attribute definition
     */
    toJSON() {
        /**
         * @typedef {Object} AttributeDefinition
         * @property {String} name - the attribute's name
         * @property {String} type - the attribute's data type
         * @property {String[]} [referenceTypes] - specifies a SCIM resourceType that a reference attribute may refer to
         * @property {Boolean} multiValued - boolean value indicating an attribute's plurality
         * @property {String} description - a human-readable description of the attribute
         * @property {Boolean} required - boolean value indicating whether or not the attribute is required
         * @property {AttributeDefinition[]} [subAttributes] - defines the sub-attributes of a complex attribute
         * @property {Boolean} [caseExact] - boolean value indicating whether or not a string attribute is case sensitive
         * @property {String[]} [canonicalValues] - collection of canonical values
         * @property {String} mutability - indicates whether or not an attribute is modifiable
         * @property {String} returned - indicates when an attribute is returned in a response
         * @property {String} [uniqueness] - indicates how unique a value must be
         */
        return {
            name: this.name,
            type: this.type,
            ...(this.type === "reference" ? {referenceTypes: this.config.referenceTypes} : {}),
            multiValued: this.config.multiValued,
            description: this.config.description,
            required: this.config.required,
            ...(this.type === "complex" ? {subAttributes: this.subAttributes} : {}),
            ...(this.config.caseExact === true || ["string", "reference", "binary"].includes(this.type) ? {caseExact: this.config.caseExact} : {}),
            ...(Array.isArray(this.config.canonicalValues) ? {canonicalValues: this.config.canonicalValues} : {}),
            mutability: (typeof this.config.mutable === "string" ? this.config.mutable
                : (this.config.mutable ? (this.config.direction === "in" ? "writeOnly" : "readWrite") : "readOnly")),
            returned: (typeof this.config.returned === "string" ? this.config.returned
                : (this.config.returned ? "default" : "never")),
            ...(this.type !== "boolean" && this.config.uniqueness !== false ? {uniqueness: this.config.uniqueness} : {})
        }
    }
}