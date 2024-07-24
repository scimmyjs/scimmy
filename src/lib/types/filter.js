import {SCIMError} from "./error.js";

/**
 * Collection of valid logical operator strings in a filter expression
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidLogicStrings
 * @memberOf SCIMMY.Types.Filter
 * @default
 */
const operators = ["and", "or", "not"];
/**
 * Collection of valid comparison operator strings in a filter expression
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidComparisonStrings
 * @memberOf SCIMMY.Types.Filter
 * @default
 */
const comparators = ["eq", "ne", "co", "sw", "ew", "gt", "lt", "ge", "le", "pr", "np"];

// Regular expressions that represent filter syntax
const lexicon = [
    // White Space, Number Values
    /(\s+)/, /([-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)(?![\w+-])/,
    // Boolean Values, Empty Values, String Values
    /(false|true)+/, /(null)+/, /("(?:[^"]|\\.|\n)*")/,
    // Logical Groups, Complex Attribute Value Filters
    /(\((?:.*?)\))/, /(\[(?:.*?)][.]?)/,
    // Logical Operators and Comparators
    new RegExp(`(${operators.join("|")})(?=[^a-zA-Z0-9]|$)`),
    new RegExp(`(${comparators.join("|")})(?=[^a-zA-Z0-9]|$)`),
    // All other "words"
    /([-$\w][-$\w._:\/%]*)/
];

// Parsing Pattern Matcher
const patterns = new RegExp(`^(?:${lexicon.map(({source}) => source).join("|")})`, "i");
// Split a path by fullstops when they aren't in a filter group or decimal
const pathSeparator = /(?<![^\w]\d)\.(?!\d[^\w]|[^[]*])/g;
// Extract attributes and filter strings from path parts
const multiValuedFilter = /^(.+?)(\[(?:.*?)])?$/;
// Match ISO 8601 formatted datetime stamps in strings
const isoDate = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?$/;

/**
 * SCIM Filter Type
 * @alias SCIMMY.Types.Filter
 * @summary
 * *   Parses SCIM [filter expressions](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2) into object representations of the filter expression.
 * @description
 * This class provides a lexer implementation to tokenise and parse SCIM [filter expression](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2) strings into meaningful object representations.  
 * It is used to automatically parse `attributes`, `excludedAttributes`, and `filter` expressions in the `{@link SCIMMY.Types.Resource}` class, and by extension, each Resource implementation.
 * The SchemaDefinition `{@link SCIMMY.Types.SchemaDefinition#coerce|#coerce()}` method uses instances of this class, typically sourced
 * from a Resource instance's `attributes` property, to determine which attributes to include or exclude on coerced resources.
 * It is also used for resolving complex multi-valued attribute operations in SCIMMY's {@link SCIMMY.Messages.PatchOp|PatchOp} implementation.
 * 
 * ### Object Representation
 * When instantiated with a valid filter expression string, the expression is parsed into an array of objects representing the given expression.
 * 
 * > **Note:**  
 * > It is also possible to substitute the expression string with an existing or well-formed expression object or set of objects.
 * > As such, valid filters can be instantiated using any of the object representations below.
 * > When instantiated this way, the `expression` property is dynamically generated from the supplied expression objects.
 * 
 * The properties of each object are directly sourced from attribute names parsed in the expression.
 * As the class intentionally has no knowledge of the underlying attribute names associated with a schema,
 * the properties of the object are case-sensitive, and will match the case of the attribute name provided in the filter.
 * ```js
 * // For the filter expressions...
 * 'userName eq "Test"', and 'uSerName eq "Test"'
 * // ...the object representations are
 * [ {userName: ["eq", "Test"]} ], and [ {uSerName: ["eq", "Test"]} ]
 * ```
 * 
 * As SCIM attribute names MUST begin with a lower-case letter, they are the exception to this rule,
 * and will automatically be cast to lower-case.
 * ```js
 * // For the filter expressions...
 * 'UserName eq "Test"', and 'Name.FamilyName eq "Test"'
 * // ...the object representations are
 * [ {userName: ["eq", "Test"]} ], and [ {name: {familyName: ["eq", "Test"]}} ]
 * ```
 * 
 * #### Logical Operations
 * ##### `and`
 * For each logical `and` operation in the expression, a new property is added to the object.
 * ```js
 * // For the filter expression...
 * 'userName co "a" and name.formatted sw "Bob" and name.honoraryPrefix eq "Mr"'
 * // ...the object representation is
 * [ {userName: ["co", "a"], name: {formatted: ["sw", "Bob"], honoraryPrefix: ["eq", "Mr"]}} ]
 * ```
 * 
 * When an attribute name is specified multiple times in a logical `and` operation, the expressions are combined into a new array containing each individual expression.
 * ```js
 * // For the filter expression...
 * 'userName sw "A" and userName ew "z"'
 * // ...the object representation is
 * [ {userName: [["sw", "A"], ["ew", "Z"]]} ]
 * ```
 * 
 * ##### `or`
 * For each logical `or` operation in the expression, a new object is added to the filter array.
 * ```js
 * // For the filter expression...
 * 'userName eq "Test" or displayName co "Bob"'
 * // ...the object representation is
 * [
 *     {userName: ["eq", "Test"]},
 *     {displayName: ["co", "Bob"]}
 * ]
 * ```
 * 
 * When the logical `or` operation is combined with the logical `and` operation, the `and` operation takes precedence.
 * ```js
 * // For the filter expression...
 * 'userName eq "Test" or displayName co "Bob" and quota gt 5'
 * // ...the object representation is
 * [
 *     {userName: ["eq", "Test"]},
 *     {displayName: ["co", "Bob"], quota: ["gt", 5]}
 * ]
 * ```
 * 
 * ##### `not`
 * Logical `not` operations in an expression are added to an object property's array of conditions.
 * ```js
 * // For the filter expression...
 * 'not userName eq "Test"'
 * // ...the object representation is
 * [ {userName: ["not", "eq", "Test"]} ]
 * ```
 * 
 * For simplicity, the logical `not` operation is assumed to only apply to the directly following comparison statement in an expression.
 * ```js
 * // For the filter expression...
 * 'userName sw "A" and not userName ew "Z" or displayName co "Bob"'
 * // ...the object representation is
 * [
 *     {userName: [["sw", "A"], ["not", "ew", "Z"]]},
 *     {displayName: ["co", "Bob"]}
 * ]
 * ```
 * 
 * If needed, logical `not` operations can be applied to multiple comparison statements using grouping operations.
 * ```js
 * // For the filter expression...
 * 'userName sw "A" and not (userName ew "Z" or displayName co "Bob")'
 * // ...the object representation is
 * [
 *     {userName: [["sw", "A"], ["not", "ew", "Z"]]},
 *     {userName: ["sw", "A"], displayName: ["not", "co", "Bob"]}
 * ]
 * ```
 * 
 * #### Grouping Operations
 * As per the order of operations in the SCIM protocol specification, grouping operations are evaluated ahead of any simpler expressions.
 * 
 * In more complex scenarios, expressions can be grouped using `(` and `)` parentheses to change the standard order of operations.  
 * This is referred to as *precedence grouping*.
 * ```js
 * // For the filter expression...
 * 'userType eq "Employee" and (emails co "example.com" or emails.value co "example.org")'
 * // ...the object representation is
 * [
 *     {userType: ["eq", "Employee"], emails: ["co", "example.com"]},
 *     {userType: ["eq", "Employee"], emails: {value: ["co", "example.org"]}}
 * ]
 * ```
 * 
 * Grouping operations can also be applied to complex attributes using the `[` and `]` brackets to create filters that target sub-attributes.  
 * This is referred to as *complex attribute filter grouping*.
 * ```js
 * // For the filter expression...
 * 'emails[type eq "work" and value co "@example.com"] or ims[type eq "xmpp" and value co "@foo.com"]'
 * // ...the object representation is
 * [
 *     {emails: {type: ["eq", "work"], value: ["co", "@example.com"]}},
 *     {ims: {type: ["eq", "xmpp"], value: ["co", "@foo.com"]}}
 * ]
 * ```
 * 
 * Complex attribute filter grouping can also be used to target sub-attribute values of multi-valued attributes with specific values.
 * ```js
 * // For the filter expression...
 * 'emails[type eq "work" or type eq "home"].values[domain ew "@example.org" or domain ew "@example.com"]'
 * // ...the object representation is
 * [
 *     {emails: {type: ["eq", "work"], values: {domain: ["ew", "@example.org"]}}},
 *     {emails: {type: ["eq", "work"], values: {domain: ["ew", "@example.com"]}}},
 *     {emails: {type: ["eq", "home"], values: {domain: ["ew", "@example.org"]}}},
 *     {emails: {type: ["eq", "home"], values: {domain: ["ew", "@example.com"]}}}
 * ]
 * ```
 * 
 * Precedence and complex attribute filter grouping can also be combined.
 * ```js
 * // For the filter expression...
 * '(userType eq "Employee" or userType eq "Manager") and emails[type eq "work" or (primary eq true and value co "@example.com")].display co "Work"'
 * // ...the object representation is
 * [
 *     {userType: ["eq", "Employee"], emails: {type: ["eq", "work"], display: ["co", "Work"]}},
 *     {userType: ["eq", "Employee"], emails: {primary: ["eq", true], value: ["co", "@example.com"], display: ["co", "Work"]}},
 *     {userType: ["eq", "Manager"], emails: {type: ["eq", "work"], display: ["co", "Work"]}},
 *     {userType: ["eq", "Manager"], emails: {primary: ["eq", true], value: ["co", "@example.com"], display: ["co", "Work"]}}
 * ]
 * ```
 * 
 * ### Other Implementations
 * It is not possible to replace internal use of the Filter class inside SCIMMY's {@link SCIMMY.Messages.PatchOp|PatchOp} and `{@link SCIMMY.Types.SchemaDefinition|SchemaDefinition}` implementations.
 * Replacing use in the `attributes` property of an instance of `{@link SCIMMY.Types.Resource}`, while technically possible, is not recommended,
 * as it may break attribute filtering in the `{@link SCIMMY.Types.SchemaDefinition#coerce|#coerce()}` method of SchemaDefinition instances.
 * 
 * If SCIMMY's filter expression resource matching does not meet your needs, it can be substituted for another implementation
 * (e.g. [scim2-parse-filter](https://github.com/thomaspoignant/scim2-parse-filter)) when filtering results within your implementation
 * of each resource type's {@link SCIMMY.Types.Resource.ingress|ingress}/{@link SCIMMY.Types.Resource.egress|egress}/{@link SCIMMY.Types.Resource.degress|degress} handler methods.
 * 
 * > **Note:**  
 * > For more information on implementing handler methods, see the `{@link SCIMMY.Types.Resource~IngressHandler|IngressHandler}/{@link SCIMMY.Types.Resource~EgressHandler|EgressHandler}/{@link SCIMMY.Types.Resource~DegressHandler|DegressHandler}` type definitions of the `SCIMMY.Types.Resource` class.
 * 
 * ```js
 * // Import the necessary methods from the other implementation, and for accessing your data source
 * import {parse, filter} from "scim2-parse-filter";
 * import {users} from "some-database-client";
 * 
 * // Register your ingress/egress/degress handler method
 * SCIMMY.Resources.User.egress(async (resource) => {
 *     // Get the original expression string from the resource's filter property...
 *     const {expression} = resource.filter;
 *     // ...and parse/handle it with the other implementation
 *     const f = filter(parse(expression));
 *     
 *     // Retrieve the data from your data source, and filter it as necessary
 *     return await users.find(/some query returning array/).filter(f);
 * });
 * ```
 */
export class Filter extends Array {
    // Make sure derivatives return native arrays
    static get [Symbol.species]() {
        return Array;
    }
    
    /**
     * The original string that was parsed by the filter, or the stringified representation of filter expression objects
     * @member {String}
     */
    expression;
    
    /**
     * Instantiate and parse a new SCIM filter string or expression
     * @param {String|Object|Object[]} expression - the query string to parse, or an existing filter expression object or set of objects
     */
    constructor(expression) {
        // See if we're dealing with an expression string
        const isString = typeof expression === "string";
        
        // Make sure expression is a string, an object, or an array of objects
        if (!isString && !(Array.isArray(expression) ? expression : [expression]).every(e => Object.getPrototypeOf(e).constructor === Object))
            throw new TypeError("Expected 'expression' parameter to be a string, object, or array of objects in Filter constructor");
        // Make sure the expression string isn't empty
        if (isString && !expression.trim().length)
            throw new TypeError("Expected 'expression' parameter string value to not be empty in Filter constructor");
        
        // Prepare underlying array and reset inheritance
        Object.setPrototypeOf(super(), Filter.prototype);
        
        // Parse the expression if it was a string
        if (isString) this.push(...Filter.#parse(expression));
        // Otherwise, clone and trap validated expression objects
        else this.push(...Filter.#objectify(Filter.#validate(expression)));
        
        // Save the original expression string, or stringify expression objects
        this.expression = (isString ? expression : Filter.#stringify(this));
        
        Object.freeze(this);
    }
    
    /**
     * Compare and filter a given set of values against this filter instance
     * @param {Object[]} values - values to evaluate filters against
     * @returns {Object[]} subset of values that match any expressions of this filter instance
     */
    match(values) {
        // Match against any of the filters in the set
        return values.filter(value => 
            this.some(f => (f !== Object(f) ? false : Object.entries(f).every(([attr, expressions]) => {
                let [,actual] = Object.entries(value).find(([key]) => key.toLowerCase() === attr.toLowerCase()) ?? [];
                const isActualDate = (actual instanceof Date || (new Date(actual).toString() !== "Invalid Date" && String(actual).match(isoDate)));
                
                if (Array.isArray(actual)) {
                    // Handle multivalued attributes by diving into them
                    return !!(new Filter(expressions).match(actual).length);
                } else if (!Array.isArray(expressions)) {
                    // Handle complex attributes by diving into them
                    return !!(new Filter([expressions]).match([actual]).length);
                } else {
                    let result = null;
                    
                    // Go through the list of expressions for the attribute to see if the value matches
                    for (let expression of (expressions.every(Array.isArray) ? expressions : [expressions])) {
                        // Bail out if the value didn't match the last expression
                        if (result === false) break;
                        
                        // Check for negation and extract the comparator and expected values
                        const negate = (expression[0].toLowerCase() === "not");
                        let [comparator, expected] = expression.slice(((+negate) - expression.length));
                        
                        // For equality tests, cast true and false strings to boolean values, maintaining EntraID support
                        if (["eq", "ne"].includes(comparator.toLowerCase()) && typeof actual === "boolean" && typeof expected === "string")
                            expected = (expected.toLowerCase() === "false" ? false : (expected.toLowerCase() === "true" ? true : expected));
                        
                        switch (comparator.toLowerCase()) {
                            default:
                                result = false;
                                break;
                            
                            case "eq":
                                result = (actual === (expected ?? undefined));
                                break;
                            
                            case "ne":
                                result = (actual !== (expected ?? undefined));
                                break;
                            
                            case "co":
                                result = String(actual).includes(expected);
                                break;
                            
                            case "sw":
                                result = String(actual).startsWith(expected);
                                break;
                            
                            case "ew":
                                result = String(actual).endsWith(expected);
                                break;
                            
                            case "gt":
                                result = (isActualDate ? (new Date(actual) > new Date(expected)) : (typeof actual === typeof expected && actual > expected));
                                break;
                            
                            case "lt":
                                result = (isActualDate ? (new Date(actual) < new Date(expected)) : (typeof actual === typeof expected && actual < expected));
                                break;
                            
                            case "ge":
                                result = (isActualDate ? (new Date(actual) >= new Date(expected)) : (typeof actual === typeof expected && actual >= expected));
                                break;
                            
                            case "le":
                                result = (isActualDate ? (new Date(actual) <= new Date(expected)) : (typeof actual === typeof expected && actual <= expected));
                                break;
                            
                            case "pr":
                                result = actual !== undefined;
                                break;
                            
                            case "np":
                                result = actual === undefined;
                                break;
                        }
                        
                        result = (negate ? !result : result);
                    }
                    
                    return result;
                }
            })))
        );
    }
    
    /**
     * Check an expression object or set of objects to make sure they are valid
     * @param {Object|Object[]} expression - the expression object or set of objects to validate
     * @param {Number} [originIndex] - the index of the original filter expression object for errors thrown while recursively validating
     * @param {String} [prefix] - the path to prepend to attribute names in thrown errors
     * @returns {Object[]} the original expression object or objects, wrapped in an array
     * @private
     */
    static #validate(expression, originIndex, prefix = "") {
        // Wrap expression in array for validating
        const expressions = Array.isArray(expression) ? expression : [expression];
        
        // Go through each expression in the array and validate it
        for (let e of expressions) {
            // Preserve the top-level index of the expression for thrown errors
            const index = originIndex ?? expressions.indexOf(e)+1;
            const props = Object.entries(e);
            
            // Make sure the expression isn't empty... 
            if (!props.length) {
                if (!prefix) throw new TypeError(`Missing expression properties for Filter expression object #${index}`);
                else throw new TypeError(`Missing expressions for property '${prefix.slice(0, -1)}' of Filter expression object #${index}`);
            }
            
            // Actually go through the expressions
            for (let [attr, expr] of props) {
                // Include prefix in attribute name of thrown errors
                const name = `${prefix}${attr}`;
                
                // If expression is an array, validate it
                if (Array.isArray(expr)) {
                    // See if we're dealing with nesting
                    const nested = expr.some(e => Array.isArray(e));
                    
                    // Make sure expression is either singular or nested, not both
                    if (nested && expr.length && !expr.every(e => Array.isArray(e)))
                        throw new TypeError(`Unexpected nested array in property '${name}' of Filter expression object #${index}`);
                    
                    // Go through and make sure each expression is valid
                    for (let e of (nested ? expr : [expr])) {
                        // Extract comparator and expected value
                        const [comparator, expected] = e.slice(e[0]?.toLowerCase?.() === "not" ? 1 : 0);
                        
                        // Make sure there was a comparator
                        if (!comparator)
                            throw new TypeError(`Missing comparator in property '${name}' of Filter expression object #${index}`);
                        // Make sure presence comparators don't include expected values
                        if (["pr", "np"].includes(comparator.toLowerCase()) && expected !== undefined)
                            throw new TypeError(`Unexpected comparison value for '${comparator}' comparator in property '${name}' of Filter expression object #${index}`);
                        // Make sure expected value was defined for any other comparator
                        if (expected === undefined && !["pr", "np"].includes(comparator.toLowerCase()))
                            throw new TypeError(`Missing expected comparison value for '${comparator}' comparator in property '${name}' of Filter expression object #${index}`);
                    }
                }
                // If expression is an object, traverse it
                else if (Object.getPrototypeOf(expr).constructor === Object)
                    Filter.#validate(expr, index, `${name}.`);
                // Otherwise, the expression is not valid
                else throw new TypeError(`Expected plain object ${name ? `or expression array in property '${name}' of` : "for"} Filter expression object #${index}`)
            }
        }
        
        // All looks good, return the expression array
        return expressions;
    }
    
    /**
     * Turn a parsed filter expression object back into a string
     * @param {SCIMMY.Types.Filter} filter - the SCIMMY filter instance to stringify
     * @returns {String} the string representation of the given filter expression object
     * @private
     */
    static #stringify(filter) {
        return filter.map((e) => Object.entries(e)
            // Create a function that can traverse objects and add prefixes to attribute names
            .map((function getMapper(prefix = "") {
                return ([attr, expr]) => {
                    // If the expression is an array, turn it back into a string
                    if (Array.isArray(expr)) {
                        const expressions = [];
                        
                        // Handle logical "and" operations applied to a single attribute
                        for (let e of expr.every(e => Array.isArray(e)) ? expr : [expr]) {
                            // Copy expression so original isn't modified
                            const parts = [...e];
                            // Then check for negations and extract the actual values
                            const negate = (parts[0].toLowerCase() === "not" ? parts.shift() : undefined);
                            const [comparator, expected] = parts;
                            const maybeValue = expected instanceof Date ? expected.toISOString() : expected;
                            const value = (typeof maybeValue === "string" ? `"${maybeValue}"` : (maybeValue !== undefined ? `${maybeValue}` : maybeValue))
                            
                            // Add the stringified expression to the results
                            expressions.push([negate, `${prefix}${attr}`, comparator, value].filter(v => !!v).join(" "));
                        }
                        
                        return expressions;
                    }
                    // Otherwise, go deeper to get the actual expression
                    else return Object.entries(expr).map(getMapper(`${prefix}${attr}.`));
                }
            })())
            // Turn all joins into a single string...
            .flat(Infinity).join(" and ")
        // ...then turn all branches into a single string
        ).join(" or ");
    }
    
    /**
     * Extract a list of tokens representing the supplied expression
     * @param {String} query - the expression to generate the token list for
     * @returns {Object[]} a set of token objects representing the expression, with details on the token kinds
     * @private
     */
    static #tokenise(query = "") {
        const tokens = [];
        let token;
        
        // Cycle through the query and tokenise it until it can't be tokenised anymore
        while (token = patterns.exec(query)) {
            // Extract the different matches from the token
            const [literal, space, number, boolean, empty, string, grouping, complex, operator, comparator, maybeWord] = token;
            let word = maybeWord;
            
            // If the token isn't whitespace, handle it!
            if (!space) {
                // Handle number, string, boolean, and null values
                if (number !== undefined) tokens.push({type: "Number", value: Number(number)});
                if (string !== undefined) tokens.push({type: "Value", value: `"${String(string.substring(1, string.length-1))}"`});
                if (boolean !== undefined) tokens.push({type: "Boolean", value: boolean === "true"});
                if (empty !== undefined) tokens.push({type: "Empty", value: "null"});
                
                // Handle logical operators and comparators
                if (operator !== undefined) tokens.push({type: "Operator", value: operator});
                if (comparator !== undefined) tokens.push({type: "Comparator", value: comparator});
                
                // Handle grouped filters
                if (grouping !== undefined) tokens.push({type: "Group", value: grouping.substring(1, grouping.length - 1)});
                
                // Treat complex attribute filters as words
                if (complex !== undefined) word = tokens.pop().value + complex;
                
                // Handle attribute names (words), and unescaped string values
                if (word !== undefined) {
                    // Start by assuming the token actually is a word
                    let current = {type: "Word", value: word};
                    
                    // If there was a previous token, make sure it was accurate
                    if (tokens.length) {
                        const previous = tokens[tokens.length-1];
                        
                        // Compound words when last token was a word ending with "."
                        if (previous.type === "Word" && previous.value.endsWith("."))
                            current.value = tokens.pop().value + word;
                        // If the previous token was a comparator...
                        else if (previous.type === "Comparator")
                            // ...this one is almost certainly an unescaped string
                            current = {type: "Value", value: `"${String(word)}"`};
                        // If a word does not follow a logical operator...
                        else if (previous.type !== "Operator")
                            // It is invalid, so skip all further traversal
                            break;
                    }
                    
                    // If all looks good, store the token
                    tokens.push(current);
                }
            }
            
            // Move on to the next token in the query
            query = query.substring(token.index + literal.length);
        }
        
        // If there are still tokens left in the query, something went wrong
        if (query.length > 0) {
            // The syntax of the query must be invalid
            let reason = `Unexpected token '${query}' in filter`;
            
            // Or a group is opened but not closed
            if (query.startsWith("(")) reason = `Missing closing ')' token in filter '${query}'`;
            if (query.startsWith("[")) reason = `Missing closing ']' token in filter '${query}'`;
            
            // Throw the error to break the cycle
            throw new SCIMError(400, "invalidFilter", reason);
        }
        
        return tokens;
    }
    
    /**
     * Divide a list of tokens into sets split by a given logical operator for parsing
     * @param {Object[]} input - list of token objects in a query to divide by the given logical operation
     * @param {String} operator - the logical operator to divide the tokens by
     * @returns {Array<Object[]>} the supplied list of tokens split wherever the given operator occurred
     * @private
     */
    static #operations(input, operator) {
        const tokens = [...input];
        const operations = [];
        
        for (let token of [...tokens]) {
            // Found the target operator token, push preceding tokens as an operation
            if (token.type === "Operator" && token.value.toLowerCase() === operator)
                operations.push(tokens.splice(0, tokens.indexOf(token) + 1).slice(0, -1));
            // Reached the end, add the remaining tokens as an operation
            else if (tokens.indexOf(token) === tokens.length - 1)
                operations.push(tokens.splice(0));
        }
        
        return operations;
    }
    
    /**
     * Translate a given set of expressions into their object representation
     * @param {Object|Object[]|Array<String[]>} expressions - list of expressions to translate into their object representation
     * @returns {Object} translated representation of the given set of expressions
     * @private
     */
    static #objectify(expressions = []) {
        // If the supplied expression was an object, deeply clone it and trap everything along the way in proxies
        if (Object.getPrototypeOf(expressions).constructor === Object) {
            const catchAll = (target, prop) => {throw new TypeError(`Cannot modify property ${prop} of immutable Filter instance`)};
            const handleTraps = {set: catchAll, deleteProperty: catchAll, defineProperty: catchAll};
            
            return new Proxy(Object.entries(expressions).reduce((res, [key, val]) => Object.assign(res, {
                [key]: Array.isArray(val) ? new Proxy(val.map(v => Array.isArray(v) ? new Proxy([...v], handleTraps) : v), handleTraps) : Filter.#objectify(val)
            }), {}), handleTraps);
        }
        // If every supplied expression was an object, make sure they've all been cloned and proxied
        else if (expressions.every(e => Object.getPrototypeOf(e).constructor === Object)) {
            return expressions.map(Filter.#objectify);
        }
        // Go through every expression in the list, or handle a singular expression if that's what was given  
        else {
            const result = {};
            
            for (let expression of (expressions.every(e => Array.isArray(e)) ? expressions : [expressions])) {
                // Check if first token is negative for later evaluation
                const negative = (expression.length === 4 ? expression.shift() : undefined)?.toLowerCase?.();
                // Extract expression parts and derive object path
                const [path, comparator, expected] = expression;
                const parts = path.split(pathSeparator).filter(p => p);
                let value = expected, target = result;
                
                // Construct the object
                for (let key of parts) {
                    // Fix the attribute name
                    const name = `${key[0].toLowerCase()}${key.slice(1)}`;
                    
                    // If there's more path to follow, keep digging
                    if (parts.indexOf(key) < parts.length - 1) target = (target[name] = target[name] ?? {});
                    // Otherwise, we've reached our destination
                    else {
                        // Unwrap string and null values, and store the translated expression
                        value = (value === "null" ? null : (String(value).match(/^["].*["]$/) ? value.substring(1, value.length - 1) : value));
                        const expression = [negative, comparator.toLowerCase(), value].filter(v => v !== undefined);
                        
                        // Either store the single expression, or convert to array if attribute already has an expression defined
                        target[name] = (!Array.isArray(target[name]) ? expression : [...(target[name].every(Array.isArray) ? target[name] : [target[name]]), expression]);
                    }
                }
            }
            
            return Filter.#objectify(result);
        }
    }
    
    /**
     * Parse a SCIM filter string into an array of objects representing the query filter
     * @param {String|Object[]} [query=""] - the filter parameter of a request as per [RFC7644§3.4.2.2]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2}
     * @returns {Object[]} parsed object representation of the queried filter
     * @private
     */
    static #parse(query = "") {
        const results = [];
        const tokens = (Array.isArray(query) ? query : Filter.#tokenise(query));
        // Initial pass to check for complexities
        const simple = !tokens.some(t => ["Operator", "Group"].includes(t.type));
        // Closer inspection in case word tokens contain nested attribute filters
        const reallySimple = simple && (tokens[0]?.value ?? tokens[0] ?? "").split(pathSeparator)
            .every(t => t === multiValuedFilter.exec(t).slice(1).shift());
        
        // If there's no operators or groups, and no nested attribute filters, assume the expression is complete
        if (reallySimple) {
            results.push(Array.isArray(query) ? tokens.map(t => t.value ?? t) : Filter.#objectify(tokens.splice(0).map(t => t?.value ?? t)));
        }
        // Otherwise, logic and groups need to be evaluated
        else {
            const expressions = [];
            
            // Go through every "or" branch in the expression
            for (let branch of Filter.#operations(tokens, "or")) {
                // Find all "and" joins in the branch
                const joins = Filter.#operations(branch, "and");
                // Find all complete expressions, and groups that need evaluating
                const expression = joins.filter(e => !e.some(t => t.type === "Group"));
                const groups = joins.filter(e => !expression.includes(e));
                
                // Go through every expression and check for nested attribute filters
                for (let e of expression.splice(0)) {
                    // Check if first token is negative for later evaluation
                    const negative = e[0].type === "Operator" && e[0].value.toLowerCase() === "not" ? e.shift() : undefined;
                    // Extract expression parts and derive object path
                    const [path, comparator, value] = e;
                    
                    // If none of the path parts have multi-value filters, put the expression back on the stack
                    if (path.value.split(pathSeparator).filter(p => p).every(t => t === multiValuedFilter.exec(t).slice(1).shift())) {
                        expression.push([negative, path, comparator, value]);
                    }
                    // Otherwise, delve into the path parts for complexities
                    else {
                        const parts = path.value.split(pathSeparator).filter(p => p);
                        // Store results and spent path parts
                        const results = [];
                        const spent = [];
                        
                        for (let part of parts) {
                            // Check for filters in the path part
                            const [, key = part, filter] = multiValuedFilter.exec(part) ?? [];
                            
                            // Store the spent path part
                            spent.push(key);
                            
                            // If we have a nested filter, handle it
                            if (filter !== undefined) {
                                let branches = Filter
                                    // Get any branches in the nested filter, parse them for joins, and properly wrap them
                                    .#operations(Filter.#tokenise(filter.substring(1, filter.length - 1)), "or")
                                    .map(b => Filter.#parse(b))
                                    .map(b => b.every(b => b.every(b => Array.isArray(b))) ? b.flat(1) : b)
                                    // Prefix any attribute paths with spent parts
                                    .map((branch) => branch.map(join => {
                                        const negative = (join.length === 4 || (join.length === 3 && comparators.includes(join[join.length-1].toLowerCase())) ? join.shift() : undefined);
                                        const [path, comparator, value] = join;
                                        
                                        return [negative?.toLowerCase?.(), `${spent.join(".")}.${path}`, comparator, value];
                                    }));
                                
                                if (!results.length) {
                                    // Extract results from the filter
                                    results.push(...branches);
                                } else {
                                    branches = branches.flat(1);
                                    
                                    // If only one branch, add it to existing results
                                    if (branches.length === 1) for (let result of results) result.push(...branches);
                                    // Otherwise, cross existing results with new branches
                                    else for (let result of results.splice(0)) {
                                        for (let branch of branches) results.push([...result, branch]);
                                    }
                                }
                            }
                            // No filter, but if we're at the end of the chain, join the last expression with the results
                            else if (parts.indexOf(part) === parts.length - 1) {
                                for (let result of results) result.push([negative?.value, spent.join("."), comparator?.value, value?.value]);
                            }
                        }
                        
                        // If there's only one result, it wasn't a very complex expression
                        if (results.length === 1) expression.push(...results.pop());
                        // Otherwise, turn the result back into a string and let groups handle it
                        else groups.push([{value: results.map(r => r.map(e => e.join(" ")).join(" and ")).join(" or ")}]);
                    }
                }
                
                // Evaluate the groups
                for (let group of groups.splice(0)) {
                    // Check for negative and extract the group token
                    const [negate, token = negate] = group;
                    // Parse the group token, negating and stripping double negatives if necessary
                    const tokens = Filter.#tokenise(token === negate ? token.value : `not ${token.value
                        .replaceAll(" and ", " and not ").replaceAll(" or ", " or not ")
                        .replaceAll(" and not not ", " and ").replaceAll(" or not not ", " or ")}`);
                    // Find all "or" branches in this group
                    const branches = Filter.#operations(tokens, "or");
                    
                    if (branches.length === 1) {
                        // No real branches, so it's probably a simple expression
                        expression.push(...Filter.#parse([...branches.pop()]));
                    } else {
                        // Cross all existing groups with this branch
                        for (let group of (groups.length ? groups.splice(0) : [[]])) {
                            // Taking into consideration any complete expressions in the block
                            for (let token of (expression.length ? expression : [[]])) {
                                for (let branch of branches) {
                                    groups.push([
                                        ...(token.length ? [token.map(t => t?.value ?? t)] : []),
                                        ...(group.length ? group : []),
                                        ...Filter.#parse(branch)
                                    ]);
                                }
                            }
                        }
                    }
                }
                
                // Consider each group its own expression
                if (groups.length) expressions.push(...groups);
                // Otherwise, collapse the expression for potential objectification
                else expressions.push(expression.map(e => e.map(t => t?.value ?? t)));
            }
            
            // Push all expressions to results, objectifying if necessary
            for (let expression of expressions) {
                results.push(...(Array.isArray(query) ? (expression.every(t => Array.isArray(t)) ? expression : [expression]) : [Filter.#objectify(expression)]));
            }
        }
        
        return results;
    }
}