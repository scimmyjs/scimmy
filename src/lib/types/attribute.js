/**
 * Collection of valid attribute type characteristic's values
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidAttributeTypes
 * @memberOf SCIMMY.Types.Attribute
 * @default
 */
const types = ["string", "complex", "boolean", "binary", "decimal", "integer", "dateTime", "reference"];

/**
 * Collection of valid attribute mutability characteristic's values
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidMutabilityValues
 * @memberOf SCIMMY.Types.Attribute
 * @default
 */
const mutability = ["readOnly", "readWrite", "immutable", "writeOnly"];

/**
 * Collection of valid attribute returned characteristic's values
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidReturnedValues
 * @memberOf SCIMMY.Types.Attribute
 * @default
 */
const returned = ["always", "never", "default", "request"];

/**
 * Collection of valid attribute uniqueness characteristic's values
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidUniquenessValues
 * @memberOf SCIMMY.Types.Attribute
 * @default
 */
const uniqueness = ["none", "server", "global"];

/**
 * Attribute value validation method container
 * @type {{canonical: validate.canonical, string: validate.string, date: validate.date, number: validate.number, reference: validate.reference}}
 * @private
 */
const validate = {
    /**
     * If the attribute has canonical values, make sure value is one of them
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    canonical: (attrib, value) => {
        if (Array.isArray(attrib.canonicalValues) && !attrib.canonicalValues.includes(value))
            throw new TypeError(`Attribute '${attrib.name}' does not include canonical value '${value}'`);
    },
    
    /**
     * If the attribute type is string, make sure value can safely be cast to string
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    string: (attrib, value) => {
        if (typeof value === "object" && value !== null) {
            // Catch array and object values as they will not cast to string as expected
            throw new TypeError(`Attribute '${attrib.name}' expected ` + (Array.isArray(value)
                ? "single value of type 'string'" : "value type 'string' but found type 'complex'"));
        }
    },
    
    /**
     * Check if value is a valid date
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    date: (attrib, value) => {
        let date = new Date(value);
        // Start with the simple date validity test
        if (!(date.toString() !== "Invalid Date"
            // Move on to the complex test, as for some reason strings like "Testing, 1, 2" parse as valid dates...
            && date.toISOString().match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?$/)))
            throw new TypeError(`Attribute '${attrib.name}' expected value to be a valid date`);
    },
    
    /**
     * If the attribute type is decimal or integer, make sure value can safely be cast to number
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    number: (attrib, value) => {
        let {type, name} = attrib,
            isNum = !!String(value).match(/^-?\d+?(\.\d+)?$/),
            isInt = isNum && !String(value).includes(".");
        
        if (typeof value === "object" && value !== null) {
            // Catch case where value is an object or array
            throw new TypeError(`Attribute '${name}' expected ` + (Array.isArray(value)
                ? `single value of type '${type}'` : `value type '${type}' but found type 'complex'`));
        }
        
        // Not a number
        if (!isNum)
            throw new TypeError(`Attribute '${name}' expected value type '${type}' but found type '${typeof value}'`);
        // Expected decimal, got integer
        if (type === "decimal" && isInt)
            throw new TypeError(`Attribute '${name}' expected value type 'decimal' but found type 'integer'`);
        // Expected integer, got decimal
        if (type === "integer" && !isInt)
            throw new TypeError(`Attribute '${name}' expected value type 'integer' but found type 'decimal'`);
    },
    
    /**
     * If the attribute type is binary, make sure value can safely be cast to buffer
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    binary: (attrib, value) => {
        let message;
        
        if (typeof value === "object" && value !== null) {
            // Catch case where value is an object or array
            if (Array.isArray(value)) message = `Attribute '${attrib.name}' expected single value of type 'reference'`;
            else message = `Attribute '${attrib.name}' expected value type 'reference' but found type 'complex'`;
        } else {
            // Start by assuming value is not binary or base64
            message = `Attribute '${attrib.name}' expected value type 'binary' to be base64 encoded string or binary octet stream`;
            
            try {
                message = (!!Buffer.from(value) ? false : message);
            } catch {
                // Value is invalid, nothing to do here
            }
        }
        
        // If there is a message, throw it!
        if (!!message) throw new TypeError(message);
    },
    
    /**
     * If the attribute type is reference, make sure value is a reference
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    reference: (attrib, value) => {
        let listReferences = attrib.config.referenceTypes.map(t => `'${t}'`).join(", "),
            coreReferences = attrib.config.referenceTypes.filter(t => ["uri", "external"].includes(t)),
            typeReferences = attrib.config.referenceTypes.filter(t => !["uri", "external"].includes(t)),
            message;
        
        // If there's no value and the attribute isn't required, skip validation
        if (value === undefined && !attrib?.config?.required) return;
        else if (typeof value === "object" && value !== null) {
            // Catch case where value is an object or array
            if (Array.isArray(value)) message = `Attribute '${attrib.name}' expected single value of type 'reference'`;
            else message = `Attribute '${attrib.name}' expected value type 'reference' but found type 'complex'`;
        } else if (listReferences.length === 0) {
            // If the referenceTypes list is empty, no value can match
            message = `Attribute '${attrib.name}' with type 'reference' does not specify any referenceTypes`;
        } else {
            // Start by assuming no reference types match
            message = `Attribute '${attrib.name}' expected value type 'reference' to refer to one of: ${listReferences}`;
            
            // Check for any valid resource type references, if any provided
            if (typeReferences.some(t => (String(value).startsWith(t) || (String(value).includes(`/${t}`))))) {
                message = false;
            }
            // If reference types includes external, make sure value is a valid URL with hostname
            else if (coreReferences.includes("external")) {
                try {
                    message = (!!new URL(value).hostname ? false : message);
                } catch {
                    // Value is invalid, nothing to do here
                }
            }
            // If reference types includes URI, make sure value can be instantiated as a URL
            else if (coreReferences.includes("uri")) {
                try {
                    // See if it can be parsed as a URL
                    message = (new URL(value) ? false : message);
                } catch {
                    // See if it's a relative URI
                    message = (String(value).startsWith("/") ? false : message);
                }
            }
        }
        
        // If there is a message, throw it!
        if (!!message) throw new TypeError(message);
    }
}

/**
 * SCIM Attribute
 * @alias SCIMMY.Types.Attribute
 * @summary
 * *   Defines a SCIM schema attribute, and is used to ensure a given resource's value conforms to the attribute definition.
 */
export class Attribute {
    /**
     * @typedef {Object} SCIMMY.Types.Attribute~AttributeConfig
     * @property {Boolean} [multiValued=false] - does the attribute expect a collection of values
     * @property {String} [description=""] - a human-readable description of the attribute
     * @property {Boolean} [required=false] - whether the attribute is required for the type instance to be valid
     * @property {Boolean|String[]} [canonicalValues=false] - values the attribute's contents must be set to
     * @property {Boolean} [caseExact=false] - whether the attribute's contents is case sensitive
     * @property {Boolean|String} [mutable=true] - whether the attribute's contents is modifiable
     * @property {Boolean|String} [returned=true] - whether the attribute is returned in a response
     * @property {Boolean|String[]} [referenceTypes=false] - list of referenced types if attribute type is reference
     * @property {String|Boolean} [uniqueness="none"] - the attribute's uniqueness characteristic
     * @property {String} [direction="both"] - whether the attribute should be present for inbound, outbound, or bidirectional requests
     */
    
    /**
     * Constructs an instance of a full SCIM attribute definition
     * @param {String} type - the data type of the attribute
     * @param {String} name - the actual name of the attribute
     * @param {SCIMMY.Types.Attribute~AttributeConfig|Object} [config] - additional config defining the attribute's characteristics
     * @param {SCIMMY.Types.Attribute[]} [subAttributes] - if the attribute is complex, the sub-attributes of the attribute
     * @property {String} type - the data type of the attribute
     * @property {String} name - the actual name of the attribute
     * @property {SCIMMY.Types.Attribute~AttributeConfig} config - additional config defining the attribute's characteristics
     * @property {SCIMMY.Types.Attribute[]} [subAttributes] - if the attribute is complex, the sub-attributes of the attribute
     */
    constructor(type, name, config = {}, subAttributes = []) {
        let errorSuffix = `attribute definition '${name}'`,
            // Collect type and name values for validation
            safelyTyped = [["type", type], ["name", name]],
            // Collect canonicalValues and referenceTypes values for validation
            safelyCollected = [["canonicalValues", config.canonicalValues], ["referenceTypes", config.referenceTypes]],
            // Collect mutability, returned, and uniqueness values for validation
            safelyConfigured = [
                ["mutability", config.mutable, mutability],
                ["returned", config.returned, returned],
                ["uniqueness", config.uniqueness, uniqueness]
            ],
            // Make sure attribute name is valid
            [, invalidNameChar] = /^(?:.*?)([^$\-_a-zA-Z0-9])(?:.*?)$/g.exec(name) ?? [];
        
        // Make sure name and type are supplied, and type is valid
        for (let [param, value] of safelyTyped) if (typeof value !== "string")
            throw new TypeError(`Required parameter '${param}' missing from Attribute instantiation`);
        if (!types.includes(type))
            throw new TypeError(`Type '${type}' not recognised in ${errorSuffix}`);
        if (!!invalidNameChar)
            throw new TypeError(`Invalid character '${invalidNameChar}' in name of ${errorSuffix}`);
        
        // Make sure mutability, returned, and uniqueness config values are valid
        for (let [key, value, values] of safelyConfigured) {
            if ((typeof value === "string" && !values.includes(value))) {
                throw new TypeError(`Attribute '${key}' value '${value}' not recognised in ${errorSuffix}`);
            } else if (value !== undefined && !["string", "boolean"].includes(typeof value)) {
                throw new TypeError(`Attribute '${key}' value must be either string or boolean in ${errorSuffix}`);
            }
        }
        
        // Make sure canonicalValues and referenceTypes are valid if they are specified
        for (let [key, value] of safelyCollected) {
            if (value !== undefined && value !== false && !Array.isArray(value)) {
                throw new TypeError(`Attribute '${key}' value must be either a collection or 'false' in ${errorSuffix}`)
            }
        }
        
        // Make sure attribute type is 'complex' if subAttributes are defined
        if (subAttributes.length && type !== "complex") {
            throw new TypeError(`Attribute type must be 'complex' when subAttributes are specified in ${errorSuffix}`);
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
     * Remove a subAttribute from a complex attribute definition
     * @param {String|SCIMMY.Types.Attribute} subAttributes - the child attributes to remove from the complex attribute definition
     * @returns {SCIMMY.Types.Attribute} this attribute instance for chaining
     */
    truncate(subAttributes) {
        if (this.type === "complex") {
            for (let subAttrib of (Array.isArray(subAttributes) ? subAttributes : [subAttributes])) {
                if (this.subAttributes.includes(subAttrib)) {
                    // Remove found subAttribute from definition
                    let index = this.subAttributes.indexOf(subAttrib);
                    if (index >= 0) this.subAttributes.splice(index, 1);
                } else if (typeof subAttrib === "string") {
                    // Attempt to find the subAttribute by name and try truncate again
                    this.truncate(this.subAttributes.find(a => a.name === subAttrib));
                }
            }
        }
        
        return this;
    }
    
    /**
     * Parse this Attribute instance into a valid SCIM attribute definition object
     * @returns {SCIMMY.Types.Attribute~AttributeDefinition} an object representing a valid SCIM attribute definition
     */
    toJSON() {
        /**
         * @typedef {Object} SCIMMY.Types.Attribute~AttributeDefinition
         * @property {String} name - the attribute's name
         * @property {String} type - the attribute's data type
         * @property {String[]} [referenceTypes] - specifies a SCIM resourceType that a reference attribute may refer to
         * @property {Boolean} multiValued - boolean value indicating an attribute's plurality
         * @property {String} description - a human-readable description of the attribute
         * @property {Boolean} required - boolean value indicating whether or not the attribute is required
         * @property {SCIMMY.Types.Attribute~AttributeDefinition[]} [subAttributes] - defines the sub-attributes of a complex attribute
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
     * @param {any|any[]} source - value to coerce and confirm conformity with attribute's characteristics
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
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.string(this, value) ?? String(value)))))
                    }));
                
                case "dateTime":
                    // Throw error if all values aren't valid dates
                    for (let value of (multiValued ? source : [source])) validate.date(this, value);
                    
                    // Convert date values to ISO strings
                    return (!multiValued ? new Date(source).toISOString() : new Proxy(source.map(v => new Date(v).toISOString()), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.date(this, value) ?? new Date(value).toISOString()))))
                    }));
                
                case "decimal":
                case "integer":
                    // Throw error if all values can't be safely cast to numbers
                    for (let value of (multiValued ? source : [source])) validate.number(this, value);
                    
                    // Cast supplied values into numbers
                    return (!multiValued ? Number(source) : new Proxy(source.map(v => Number(v)), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.number(this, value) ?? Number(value)))))
                    }));
                
                case "reference":
                    // Throw error if all values can't be safely cast to strings
                    for (let value of (multiValued ? source : [source])) validate.reference(this, value);
                    
                    // Cast supplied values into strings
                    return (!multiValued ? String(source) : new Proxy(source.map(v => String(v)), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) =>(!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.reference(this, value) ?? String(value)))))
                    }));
                
                case "binary":
                    // Throw error if all values can't be safely cast to buffers
                    for (let value of (multiValued ? source : [source])) validate.binary(this, value);
                    
                    // Cast supplied values into strings
                    return (!multiValued ? String(source) : new Proxy(source.map(v => String(v)), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.binary(this, value) ?? String(value)))))
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
                            Object.defineProperties(target, {
                                // Because why bother with case-sensitivity in a JSON-based standard?
                                // See: RFC7643§2.1 (https://datatracker.ietf.org/doc/html/rfc7643#section-2.1)
                                [name.toLowerCase()]: {
                                    get: () => (target[name]),
                                    set: (value) => (target[name] = value)
                                },
                                // Now set the handles for the actual name
                                // Overrides above if name is already all lower case
                                [name]: {
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
                                }
                            });
                        }
                        
                        // Prevent changes to target
                        Object.freeze(target);
                        
                        // Then add specified values to the target, invoking sub-attribute coercion
                        for (let [key, value] of Object.entries(source)) try {
                            target[key.toLowerCase()] = value;
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
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value : this.coerce(value, direction, true)))))
                    })));
                
                default:
                    return source;
            }
        }
    }
}