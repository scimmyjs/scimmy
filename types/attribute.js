/**
 * Collection of valid attribute type characteristic's values
 * @type {string[]}
 */
const types = ["string", "complex", "boolean", "binary", "decimal", "integer", "dateTime", "reference"];

/**
 * Collection of valid attribute mutability characteristic's values
 * @type {string[]}
 */
const mutability = ["readOnly", "readWrite", "immutable", "writeOnly"];

/**
 * Collection of valid attribute returned characteristic's values
 * @type {string[]}
 */
const returned = ["always", "never", "default", "request"];

/**
 * Collection of valid attribute uniqueness characteristic's values
 * @type {string[]}
 */
const uniqueness = ["none", "server", "global"];

/**
 * Attribute value validation method container
 * @type {{date: validate.date, canonical: validate.canonical}}
 */
const validate = {
    /**
     * If the attribute has canonical values, make sure value is one of them
     * @param {Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    canonical: (attrib, value) => {
        if (Array.isArray(attrib.canonicalValues) && !attrib.canonicalValues.includes(value))
            throw new TypeError(`Attribute '${attrib.name}' does not include canonical value '${value}'`);
    },
    
    /**
     * If the attribute type is string, make sure value can safely be cast to string
     * @param {Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    string: (attrib, value) => {
        if (typeof value === "object") {
            if (!Array.isArray(value)) {
                throw new TypeError(`Attribute '${attrib.name}' expected value type 'string' but found type 'complex'`);
            } else {
                throw new TypeError(`Attribute '${attrib.name}' expected single value of type 'string'`);
            }
        }
    },
    
    /**
     * Check if value is a valid date
     * @param {Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    date: (attrib, value) => {
        let date = new Date(value);
        // Start with the simple date validity test
        if (!(date.toString() !== "Invalid Date"
            // Move on to the complex test, as for some reason strings like "Testing, 1, 2" parse as valid dates...
            && date.toISOString().match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?$/)))
            throw new TypeError(`Attribute '${attrib.name}' expected value to be a valid date`);
    }
}

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
        let errorSuffix = `in attribute definition '${name}'`,
            // Collect type and name values for validation
            safelyTyped = [["type", type], ["name", name]],
            // Collect canonicalValues and referenceTypes values for validation
            safelyCollected = [["canonicalValues", config.canonicalValues], ["referenceTypes", config.referenceTypes]],
            // Collect mutability, returned, and uniqueness values for validation
            safelyConfigured = [
                ["mutability", config.mutable, mutability],
                ["returned", config.returned, returned],
                ["uniqueness", config.uniqueness, uniqueness]
            ];
        
        // Make sure name and type are supplied, and type is valid
        for (let [param, value] of safelyTyped) if (typeof value !== "string")
            throw new TypeError(`Required parameter '${param}' missing from Attribute instantiation`);
        if (!types.includes(type)) {
            throw new TypeError(`Type '${type}' not recognised ${errorSuffix}`);
        }
        
        // Make sure mutability, returned, and uniqueness config values are valid
        for (let [key, value, values] of safelyConfigured) {
            if ((typeof value === "string" && !values.includes(value))) {
                throw new TypeError(`Attribute '${key}' value '${value}' not recognised ${errorSuffix}`);
            } else if (value !== undefined && !["string", "boolean"].includes(typeof value)) {
                throw new TypeError(`Attribute '${key}' value must be either string or boolean ${errorSuffix}`);
            }
        }
        
        // Make sure canonicalValues and referenceTypes are valid if they are specified
        for (let [key, value] of safelyCollected) {
            if (value !== undefined && value !== false && !Array.isArray(value)) {
                throw new TypeError(`Attribute '${key}' value must be either a collection or 'false' ${errorSuffix}`)
            }
        }
        
        // Make sure attribute type is 'complex' if subAttributes are defined
        if (subAttributes.length && type !== "complex") {
            throw new TypeError(`Attribute type must be 'complex' when subAttributes are specified ${errorSuffix}`);
        }
        
        // Attribute config is valid, proceed
        this.type = type;
        this.name = name;
        this.config = {
            required: false, mutable: true, multiValued: false, caseExact: false, returned: true,
            description: "", canonicalValues: false, referenceTypes: false, uniqueness: "none", direction: "both",
            ...config
        };
        
        if (type === "complex") this.subAttributes = [...subAttributes];
        
        // Prevent this attribute definition from changing!
        // Note: config and subAttributes can still be modified, just not replaced.
        Object.freeze(this);
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
                throw new TypeError(`Required attribute '${this.name}' is missing`);
            // If the attribute is multi-valued, make sure its value is a collection
            if (!isComplexMultiValue && multiValued && source !== undefined && !Array.isArray(source))
                throw new TypeError(`Attribute '${this.name}' expected to be a collection`);
            // If the attribute is NOT multi-valued, make sure its value is NOT a collection
            if (!multiValued && Array.isArray(source))
                throw new TypeError(`Attribute '${this.name}' is not multi-valued and must not be a collection`);
            // If the attribute specifies canonical values, make sure all values are valid
            if (Array.isArray(canonicalValues) && (!(multiValued ? (source ?? []).every(v => canonicalValues.includes(v)) : canonicalValues.includes(source))))
                throw new TypeError(`Attribute '${this.name}' contains non-canonical value`);
            
            // If the source has a value, parse it
            if (source !== undefined) switch (this.type) {
                case "string":
                    // Throw error if all values can't be safely cast to strings
                    for (let value of (multiValued ? source : [source])) validate.string(this, value);
                    
                    // Cast supplied values into strings
                    return (!multiValued ? String(source) : new Proxy(source.map(v => String(v)), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) =>
                            (target[key] = validate.canonical(this, value) ?? validate.string(this, value) ?? value)
                    }));
                
                case "dateTime":
                    // Throw error if all values aren't valid dates
                    for (let value of (multiValued ? source : [source])) validate.date(this, value);
                    
                    // Convert date values to ISO strings
                    return (!multiValued ? new Date(source).toISOString() : new Proxy(source.map(v => new Date(v).toISOString()), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) =>
                            (target[key] = validate.canonical(this, value) ?? validate.date(this, value) ?? value)
                    }));
                
                case "boolean":
                    // Cast supplied values into booleans
                    return (!multiValued ? !!source : new Proxy(source.map(v => !!v), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (target[key] = !!value)
                    }));
                
                case "complex":
                    // Prepare for a complex attribute's values
                    let target = (!isComplexMultiValue ? [] : {});
                    
                    // Evaluate complex attribute's sub-attributes
                    if (isComplexMultiValue) {
                        let resource = {};
                        
                        // Go through each sub-attribute for coercion
                        for (let subAttribute of this.subAttributes) {
                            let {name} = subAttribute;
                            
                            // Predefine getters and setters for all possible sub-attributes
                            Object.defineProperty(target, name, {
                                enumerable: true,
                                // Get and set the value from the internally scoped object
                                get: () => (resource[name]),
                                // Validate the supplied value through attribute coercion
                                set: (value) => {
                                    try {
                                        return (resource[name] = subAttribute.coerce(value, direction))
                                    } catch (ex) {
                                        // Add additional context
                                        ex.message += ` from complex attribute '${this.name}'`;
                                        throw ex;
                                    }
                                }
                            });
                        }
                        
                        // Prevent changes to target
                        Object.freeze(target);
                        
                        // Then add specified values to the target, invoking sub-attribute coercion
                        for (let [key, value] of Object.entries(source)) try {
                            target[`${key[0].toLowerCase()}${key.slice(1)}`] = value;
                        } catch (ex) {
                            // Attempted to add an undeclared attribute to the value
                            if (ex instanceof TypeError && ex.message.endsWith("not extensible")) {
                                ex.message = `Complex attribute '${this.name}' `
                                    + (typeof source !== "object" || Array.isArray(source)
                                    ? `expected complex value but received '${source}'`
                                    : `does not declare subAttribute '${key}'`);
                            }
                            
                            throw ex;
                        }
                    } else {
                        // Go through each value and coerce their sub-attributes
                        for (let value of (multiValued ? source : [source])) {
                            target.push(this.coerce(value, direction, true));
                        }
                    }
                    
                    // Return the collection, or the coerced complex value
                    return (isComplexMultiValue ? target : (!multiValued ? target.pop() : new Proxy(target, {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) =>
                            (!!(target[key] = (Number.isInteger(Number(key)) ? this.coerce(value, direction, true) : value)))
                    })));
                
                default:
                    // TODO: decimal, integer, and reference handlers
                    return source;
            }
        }
    }
}