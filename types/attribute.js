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
     * @param {Boolean|String[]} [config.referenceTypes=false] - list of referenced types if attribute type is reference
     * @param {String|Boolean} [config.uniqueness="none"] - the attribute's uniqueness characteristic
     * @param {String} [config.direction="both"] - whether the attribute should be present for inbound, outbound, or bidirectional requests
     * @param {Attribute[]} [subAttributes] - if the attribute is complex, the sub-attributes of the attribute
     */
    constructor(type, name, config = {}, subAttributes = []) {
        // TODO: validate attribute type, mutability, returned, and uniqueness values
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
    
    /**
     * Coerce a given value by making sure it conforms to attribute's characteristics
     * @param {*|*[]} source - value to coerce and confirm conformity with attribute's characteristics
     * @param {String} [direction] - whether to check for inbound, outbound, or bidirectional attributes
     * @param {Boolean} [isComplexMultiValue=false] - indicates whether a coercion is for a single complex value in a collection of complex values
     * @returns {String|String[]|Number|Boolean|Object|Object[]} the coerced value, conforming to attribute's characteristics
     */
    coerce(source, direction = "both", isComplexMultiValue = false) {
        // Make sure the direction matches the attribute direction
        if (["both", direction].includes(this.config.direction)) {
            let {required, multiValued, canonicalValues} = this.config;
            
            // If the attribute is required, make sure it has a value
            if (required && source === undefined)
                throw new TypeError(`Required attribute ${this.name} is missing`);
            // If the attribute is multi-valued, make sure its value is a collection
            if (!isComplexMultiValue && multiValued && source !== undefined && !Array.isArray(source))
                throw new TypeError(`Attribute ${this.name} expected to be a collection`);
            // If the attribute has canonical values, make sure it matches
            if (Array.isArray(canonicalValues) && (!(multiValued ? (source ?? []).every(v => canonicalValues.includes(v)) : canonicalValues.includes(source))))
                throw new TypeError(`Attribute ${this.name} contains non-canonical value`);
            
            // If the source has a value, parse it
            if (source !== undefined) switch (this.type) {
                case "string":
                    // Cast supplied values into strings
                    return (multiValued ? source.map(v => String(v)) : String(source));
                
                case "dateTime":
                    // Check if value is a valid date
                    let validate = (v) => (v instanceof Date && v.toString() !== "Invalid Date");
                    
                    // Throw error if all values aren't valid dates
                    if (!(multiValued ? source.every(validate) : validate(source)))
                        throw new TypeError(`Attribute ${name} expected value to be a valid date`);
                    
                    // Convert date values to ISO strings
                    return (multiValued ? source.map(v => new Date(v).toISOString()) : new Date(source).toISOString());
                
                case "boolean":
                    // Cast supplied values into booleans
                    return (multiValued ? source.map(v => !!v) : !!source);
                
                case "complex":
                    // Prepare for a complex attribute's values
                    let target = (!isComplexMultiValue ? [] : {});
                    
                    // Evaluate complex attribute's sub-attributes
                    if (isComplexMultiValue) {
                        // Go through each sub-attribute for coercion
                        for (let subAttribute of this.subAttributes) {
                            let {name, config: {required}} = subAttribute;
                            
                            // If the value is defined or required, coerce it
                            if (name in source || required) {
                                let value = subAttribute.coerce(source[name] ?? source[`${name[0]}${name.slice(1)}`], direction);
                                
                                // If the value is not empty, apply it to the target
                                if (value !== undefined) target[name] = value;
                            }
                        }
                    } else {
                        // Go through each value and coerce their sub-attributes
                        for (let value of (multiValued ? source : [source])) {
                            target.push(this.coerce(value, direction, true));
                        }
                    }
                    
                    // Return the collection, or the coerced complex value
                    return (multiValued || isComplexMultiValue ? target : target.pop());
                
                default:
                    // TODO: decimal, integer, and reference handlers
                    return source;
            }
        }
    }
}