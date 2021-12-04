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
// Parsing Pattern Matcher
const patterns = /^(?:(\s+)|(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)|("(?:[^"]|\\.|\n)*")|(\((?:.*?)\))|(\[(?:.*?)\])|(\w[-\w\._:\/%]*))/;
// Split a path by fullstops when they aren't in a filter group or decimal
const pathSeparator = /(?<![^\w]\d)\.(?!\d[^\w]|[^[]*])/g;
// Extract attributes and filter strings from path parts
const multiValuedFilter = /^(.+?)(\[(?:.*?)])?$/;

/**
 * SCIM Filter Type
 * @alias SCIMMY.Types.Filter
 * @summary
 * *   Parses SCIM [filter expressions](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2) into object representations of the filter expression, for use in resource retrieval.
 */
export class Filter extends Array {
    // Make sure derivatives return native arrays
    static get [Symbol.species]() {
        return Array;
    }
    
    /**
     * Instantiate and parse a new SCIM filter string or expression
     * @param {String|Object[]} [expression] - the query string to parse, or an existing set of filter expressions
     * @property {String} [expression] - the raw string that was parsed by the filter
     */
    constructor(expression = []) {
        // Make sure expression is a string, an object, or an array
        if (!["string", "object"].includes(typeof expression))
            throw new TypeError("Expected 'expression' parameter to be a string, object, or array in Filter constructor");
        
        // Prepare underlying array and reset inheritance
        super(...(Object(expression) === expression ? Array.isArray(expression) ? expression : [expression] : []));
        Object.setPrototypeOf(this, Filter.prototype);
        
        // Handle expression strings
        if (typeof expression === "string") {
            // Make sure the expression string isn't empty
            if (!expression.trim().length)
                throw new TypeError("Expected 'expression' parameter string value to not be empty in Filter constructor");
            
            // Save and parse the expression
            this.expression = expression;
            this.splice(0, 0, ...Filter.#parse(String(expression)));
        }
    }
    
    /**
     * Compare and filter a given set of values against this filter instance
     * @param {Object[]} values - values to evaluate filters against
     * @returns {Object[]} subset of values that match any expressions of this filter instance
     */
    match(values) {
        // Match against any of the filters in the set
        // TODO: finish comparators and handle nesting
        return values.filter(value => 
            this.some(f => (f !== Object(f) ? false : Object.entries(f).every(([attr, [comparator, expected]]) => {
                // Cast true and false strings to boolean values
                expected = (expected === "false" ? false : (expected === "true" ? true : expected));
                
                switch (comparator) {
                    case "co":
                        return String(value[attr]).includes(expected); 
                    
                    case "pr":
                        return attr in value;
                    
                    case "eq":
                        return value[attr] === expected;
                    
                    case "ne":
                        return value[attr] !== expected;
                }
            })))
        );
    }
    
    /**
     * Extract a list of tokens representing the supplied expression 
     * @param {String} query - the expression to generate the token list for
     * @returns {Object[]} a set of token objects representing the expression, with details on the token kinds 
     */
    static #tokenise(query = "") {
        let tokens = [],
            token;
        
        // Strip grouping characters from start and end, if necessary
        if ((query.startsWith("[") && query.endsWith("]")) || (query.startsWith("(") && query.endsWith(")")))
            query = query.substring(1, query.length - 1);
        
        // Cycle through the query and tokenise it until it can't be tokenised anymore
        while (token = patterns.exec(query)) {
            // Extract the different matches from the token
            let [literal, space, number, string, grouping, attribute, word] = token;
            
            // If the token isn't whitespace, handle it!
            if (!space) {
                // Handle number and string values
                if (number !== undefined) tokens.push({type: "Number", value: Number(number)});
                if (string !== undefined) tokens.push({type: "Value", value: String(string.substring(1, string.length-1))});
                
                // Handle grouped filters
                if (grouping !== undefined) tokens.push({type: "Group", value: grouping.substring(1, grouping.length - 1)});
                
                // Handle attribute filters inline
                if (attribute !== undefined) word = tokens.pop().value + attribute;
                
                // Handle operators, comparators, and attribute names
                if (word !== undefined) tokens.push({
                    type: (operators.includes(word) ? "Operator" : (comparators.includes(word) ? "Comparator" : "Word")),
                    value: word
                });
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
     * @param {Object[]} tokens - list of token objects in a query to divide by the given logical operation 
     * @param {String} operator - the logical operator to divide the tokens by 
     * @returns {Array<Object[]>} the supplied list of tokens split wherever the given operator occurred  
     */
    static #operations(tokens, operator) {
        let operations = [];
        
        for (let token of [...tokens]) {
            // Found the target operator token, push preceding tokens as an operation
            if (token.type === "Operator" && token.value === operator)
                operations.push(tokens.splice(0, tokens.indexOf(token) + 1).slice(0, -1));
            // Reached the end, add the remaining tokens as an operation
            else if (tokens.indexOf(token) === tokens.length - 1)
                operations.push(tokens.splice(0));
        }
        
        return operations;
    }
    
    /**
     * Translate a given set of expressions into their object representation
     * @param {Array<String[]>} expressions - list of expressions to combine into their object representation
     * @returns {Object} translated representation of the given set of expressions
     */
    static #objectify(expressions = []) {
        let result = {};
        
        // Go through every expression in the list, or handle a singular expression if that's what was given  
        for (let expression of (expressions.every(e => Array.isArray(e)) ? expressions : [expressions])) {
            // Check if first token is negative for later evaluation
            let negative = expression[0] === "not" ? expression.shift() : false,
                // Extract expression parts and derive object path
                [path, comparator, value] = expression,
                parts = path.split(pathSeparator).filter(p => p),
                target = result;
            
            // Construct the object
            for (let part of parts) {
                // Check for filters in the path and fix the attribute name
                let [, key = part, filter] = multiValuedFilter.exec(part) ?? [],
                    name = `${key[0].toLowerCase()}${key.slice(1)}`;
                
                // If we have a nested filter, handle it
                if (filter !== undefined) {
                    let values = Filter.#parse(filter.substring(1, filter.length - 1));
                    if (values.length === 1) {
                        target[name] = Object.assign(target[name] ?? {}, values.pop());
                    } else {
                        console.log(values);
                    }
                }
                // If there's more path to follow, keep digging
                else if (parts.indexOf(part) < parts.length - 1) {
                    target = (target[name] = target[name] ?? {});
                }
                // Otherwise, we've reached our destination
                else {
                    // Store the translated expression
                    target[name] = [negative, comparator, value].filter(v => v);
                }
            }
        }
        
        return result;
    }
    
    /**
     * Parse a SCIM filter string into an array of objects representing the query filter
     * @param {String|Object[]} [query=""] - the filter parameter of a request as per [RFC7644§3.4.2.2]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2}
     * @returns {Object[]} parsed object representation of the queried filter
     * @private
     */
    static #parse(query = "") {
        let tokens = (Array.isArray(query) ? query : Filter.#tokenise(query)),
            results = [];
        
        // If there's no operators or groups, assume the expression is complete
        if (!tokens.some(t => ["Operator", "Group"].includes(t.type))) {
            results.push(Array.isArray(query) ? tokens.map(t => t.value) : Filter.#objectify(tokens.splice(0).map(t => t.value)));
        }
        // Otherwise, logic and groups need to be evaluated
        else {
            let expressions = [];
            
            // Go through every "or" branch in the expression
            for (let branch of Filter.#operations(tokens, "or")) {
                // Find all "and" joins in the branch
                let joins = Filter.#operations(branch, "and"),
                    // Find all complete expressions, and groups that need evaluating
                    expression = joins.filter(e => !e.some(t => t.type === "Group")),
                    groups = joins.filter(e => !expression.includes(e));
                
                // Evaluate the groups
                for (let group of groups.splice(0)) {
                    // Check for negative and extract the group token
                    let [negate, token = negate] = group,
                        // Parse the group token, negating and stripping double negatives if necessary
                        tokens = Filter.#tokenise(token === negate ? token.value : `not ${token.value
                            .replaceAll(" and ", " and not ").replaceAll(" or ", " or not ")
                            .replaceAll(" and not not ", " and ").replaceAll(" or not not ", " or ")}`),
                        // Find all "or" branches in this group
                        branches = Filter.#operations(tokens, "or");
                    
                    // Cross all existing groups with this branch
                    for (let group of (groups.length ? groups.splice(0) : [[]])) {
                        // Taking into consideration any complete expressions in the block
                        for (let token of (expression.length ? expression : [[]])) {
                            for (let branch of branches) {
                                groups.push([
                                    ...(token.length ? [token.map(t => t.value)] : []),
                                    ...(group.length ? group : []),
                                    ...Filter.#parse(branch)
                                ]);
                            }
                        }
                    }
                }
                
                // Consider each group its own expression
                if (groups.length) expressions.push(...groups);
                // Otherwise, collapse the expression for potential objectification
                else expressions.push(expression.map(e => e.map(t => t.value)));
            }
            
            // Push all expressions to results, objectifying if necessary
            for (let expression of expressions) {
                results.push(...(Array.isArray(query) ? expression : [Filter.#objectify(expression)]));
            }
        }
        
        return results;
    }
}