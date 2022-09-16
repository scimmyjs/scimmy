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
const patterns = /^(?:(\s+)|(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)|(false|true)+|(null)+|("(?:[^"]|\\.|\n)*")|(\((?:.*?)\))|(\[(?:.*?)][.]?)|(\w[-\w._:\/%]*))/;
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
                        const negate = (expression[0] === "not");
                        let [comparator, expected] = expression.slice(((+negate) - expression.length));
                        
                        // Cast true and false strings to boolean values
                        expected = (expected === "false" ? false : (expected === "true" ? true : expected));
                        
                        switch (comparator) {
                            default:
                                result = false;
                                break;
                            
                            case "eq":
                                result = (actual === expected);
                                break;
                            
                            case "ne":
                                result = (actual !== expected);
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
     * Extract a list of tokens representing the supplied expression
     * @param {String} query - the expression to generate the token list for
     * @returns {Object[]} a set of token objects representing the expression, with details on the token kinds
     * @private
     */
    static #tokenise(query = "") {
        let tokens = [],
            token;
        
        // Cycle through the query and tokenise it until it can't be tokenised anymore
        while (token = patterns.exec(query)) {
            // Extract the different matches from the token
            let [literal, space, number, boolean, empty, string, grouping, attribute, word] = token;
            
            // If the token isn't whitespace, handle it!
            if (!space) {
                // Handle number, string, boolean, and null values
                if (number !== undefined) tokens.push({type: "Number", value: Number(number)});
                if (string !== undefined) tokens.push({type: "Value", value: `"${String(string.substring(1, string.length-1))}"`});
                if (boolean !== undefined) tokens.push({type: "Boolean", value: boolean === "true"});
                if (empty !== undefined) tokens.push({type: "Empty", value: "null"});
                
                // Handle grouped filters
                if (grouping !== undefined) tokens.push({type: "Group", value: grouping.substring(1, grouping.length - 1)});
                
                // Handle attribute filters inline
                if (attribute !== undefined) word = tokens.pop().value + attribute;
                
                // Handle operators, comparators, and attribute names
                if (word !== undefined) {
                    // Compound words when last token was a word ending with "."
                    if (tokens.length && tokens[tokens.length-1].type === "Word" && tokens[tokens.length-1].value.endsWith("."))
                        word = tokens.pop().value + word;
                    
                    // Store the token, deriving token type by matching against known operators and comparators
                    tokens.push({type: (operators.includes(word) ? "Operator" : (comparators.includes(word) ? "Comparator" : "Word")), value: word});
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
     * @param {Object[]} tokens - list of token objects in a query to divide by the given logical operation
     * @param {String} operator - the logical operator to divide the tokens by
     * @returns {Array<Object[]>} the supplied list of tokens split wherever the given operator occurred
     * @private
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
     * @private
     */
    static #objectify(expressions = []) {
        let result = {};
        
        // Go through every expression in the list, or handle a singular expression if that's what was given  
        for (let expression of (expressions.every(e => Array.isArray(e)) ? expressions : [expressions])) {
            // Check if first token is negative for later evaluation
            let negative = expression[0] === "not" ? expression.shift() : undefined,
                // Extract expression parts and derive object path
                [path, comparator, value] = expression,
                parts = path.split(pathSeparator).filter(p => p),
                target = result;
            
            // Construct the object
            for (let key of parts) {
                // Fix the attribute name
                let name = `${key[0].toLowerCase()}${key.slice(1)}`;
                
                // If there's more path to follow, keep digging
                if (parts.indexOf(key) < parts.length - 1) target = (target[name] = target[name] ?? {});
                // Otherwise, we've reached our destination
                else {
                    // Unwrap string and null values, and store the translated expression
                    value = (value === "null" ? null : (String(value).match(/^["].*["]$/) ? value.substring(1, value.length - 1) : value));
                    const expression = [negative, comparator, value].filter(v => v !== undefined);
                    
                    // Either store the single expression, or convert to array if attribute already has an expression defined
                    target[name] = (!Array.isArray(target[name]) ? expression : [...(target[name].every(Array.isArray) ? target[name] : [target[name]]), expression]);
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
            // Initial pass to check for complexities 
            simple = !tokens.some(t => ["Operator", "Group"].includes(t.type)),
            // Closer inspection in case word tokens contain nested attribute filters
            reallySimple = simple && (tokens[0]?.value ?? tokens[0] ?? "")
                .split(pathSeparator).every(t => t === multiValuedFilter.exec(t).slice(1).shift()),
            results = [];
        
        // If there's no operators or groups, and no nested attribute filters, assume the expression is complete
        if (reallySimple) {
            results.push(Array.isArray(query) ? tokens.map(t => t.value ?? t) : Filter.#objectify(tokens.splice(0).map(t => t.value ?? t)));
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
                
                // Go through every expression and check for nested attribute filters
                for (let e of expression.splice(0)) {
                    // Check if first token is negative for later evaluation
                    let negative = e[0].value === "not" ? e.shift() : undefined,
                        // Extract expression parts and derive object path
                        [path, comparator, value] = e;
                    
                    // If none of the path parts have multi-value filters, put the expression back on the stack
                    if (path.value.split(pathSeparator).filter(p => p).every(t => t === multiValuedFilter.exec(t).slice(1).shift())) {
                        expression.push([negative, path, comparator, value].filter(v => v !== undefined));
                    }
                    // Otherwise, delve into the path parts for complexities
                    else {
                        let parts = path.value.split(pathSeparator).filter(p => p),
                            // Store results and spent path parts
                            results = [],
                            spent = [];
                        
                        for (let part of parts) {
                            // Check for filters in the path part
                            let [, key = part, filter] = multiValuedFilter.exec(part) ?? [];
                            
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
                                        let negative = (join[0] === "not" ? join.shift() : undefined),
                                            [path, comparator, value] = join;
                                        
                                        return [negative, `${spent.join(".")}.${path}`, comparator, value].filter(v => v !== undefined);
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
                                for (let result of results) result.push([negative?.value, spent.join("."), comparator?.value, value?.value].filter(v => v !== undefined));
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
                    let [negate, token = negate] = group,
                        // Parse the group token, negating and stripping double negatives if necessary
                        tokens = Filter.#tokenise(token === negate ? token.value : `not ${token.value
                            .replaceAll(" and ", " and not ").replaceAll(" or ", " or not ")
                            .replaceAll(" and not not ", " and ").replaceAll(" or not not ", " or ")}`),
                        // Find all "or" branches in this group
                        branches = Filter.#operations(tokens, "or");
                    
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
                                        ...(token.length ? [token.map(t => t.value ?? t)] : []),
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
                else expressions.push(expression.map(e => e.map(t => t.value ?? t)));
            }
            
            // Push all expressions to results, objectifying if necessary
            for (let expression of expressions) {
                results.push(...(Array.isArray(query) ? (expression.every(t => Array.isArray(t)) ? expression : [expression]) : [Filter.#objectify(expression)]));
            }
        }
        
        return results;
    }
}