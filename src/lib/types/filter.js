import {SCIMError} from "./error.js";

// Logic Operators
const operators = ["and", "or", "not"];
// Comparison Operations
const comparators = ["eq", "ne", "co", "sw", "ew", "gt", "lt", "ge", "le", "pr", "np"];
// Parsing Pattern Matcher
const patterns = /^(?:(\s+)|(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)|("(?:[^"]|\\.|\n)*")|(\[(?:.*?)\]|\((?:.*?)\))|(\w[-\w\._:\/%]*))/;

/**
 * SCIM Filter Type
 * @class SCIMMY.Types.Filter
 * @extends {Array<T>}
 */
export class Filter extends Array {
    /**
     * Instantiate and parse a new SCIM filter string or expression
     * @param {String|Object[]} [query] - the query string to parse, or an existing set of filter expressions
     */
    constructor(query = "") {
        super(...(Array.isArray(query) ? query : []));
        Object.setPrototypeOf(this, Filter.prototype);
        if (typeof query === "string" && query.length) this.splice(0, 0, ...Filter.#parse(String(query)));
    }
    
    /**
     * Compare and filter a given set of values against this filter instance
     * @param {Object[]} values - values to evaluate filters against
     * @returns {Object[]} subset of values that match any expressions of this filter instance
     */
    match(values) {
        // Match against any of the filters in the set
        return values.filter(value => [...this]
            .some(f => (f !== Object(f) ? false : Object.entries(f).every(([attr, [comparator, expected]]) => {
                // Cast true and false strings to boolean values
                expected = (expected === "false" ? false : (expected === "true" ? true : expected));
                
                switch (comparator) {
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
     * Parse a SCIM filter string into an array of objects representing the query filter
     * @private
     * @param {String} [query=""] - the filter parameter of a request as per [RFC7644§3.4.2.2]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2}
     * @returns {Object[]} parsed object representation of the queried filter
     */
    static #parse(query = "") {
        let results = [],
            tokens = [],
            token;
        
        // Cycle through the query and tokenise it until it can't be tokenised anymore
        while (token = patterns.exec(query)) {
            // Extract the different matches from the token
            let [literal, space, number, string, grouping, word] = token;
            
            // If the token isn't whitespace, handle it!
            if (!space) {
                // Handle number and string values
                if (number !== undefined) tokens.push({type: "Number", value: Number(number)});
                if (string !== undefined) tokens.push({type: "Value", value: String(string.substring(1, string.length-1))});
                
                // Handle grouped filters recursively
                if (grouping !== undefined) tokens.push({
                    type: "Group", value: Filter.#parse(grouping.substring(1, grouping.length - 1))
                });
                
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
        
        // Go through the tokens and collapse the wave function!
        while (tokens.length > 0) {
            // Get the next token
            let {value: literal, type} = tokens.shift(),
                result = {},
                operator;
            
            // Handle group tokens
            if (type === "Group" && Array.isArray(literal)) {
                // Unwrap the group if it only contains one statement, otherwise wrap it
                // TODO: what if the group is empty or contains empty statements?
                results.push(literal.length === 1 ? literal.pop() ?? {} : {"&&": literal});
            }
            
            // Handle joining operators
            if (type === "Operator") {
                // Cache the current operator
                operator = literal;
                
                // If operator is "and", get the last result to write the next statement to
                if (operator === "and" && results.length > 0) result = results.pop();
                
                // If the next token is a "not" operator, handle negation of statement
                if (tokens[0]?.type === "Operator" && tokens[0]?.value === "not") {
                    // Update the cached operator and put the result back on the stack
                    ({value: operator} = tokens.shift());
                    results.push(result);
                    
                    // Continue evaluating the stack but on the special negative ("!!") property
                    result = result["!!"] = Array.isArray(tokens[0]?.value) ? [] : {};
                }
                
                // Move to the next token
                ({value: literal, type} = tokens.shift());
                
                // Poorly written filters sometimes unnecessarily include groups...
                if (Array.isArray(literal)) {
                    // Put the result back on the stack (unless "not" already put it there)
                    if (operator !== "not") results.push(result);
                    // If the group only contains one statement, unwrap it
                    if (literal.length === 1) Object.assign(result, literal.pop() ?? {});
                    // If the group follows a negation operator, add it to the negative ("!!") property
                    else if (operator === "not") result.splice(0, 0, ...literal);
                    // If a joining operator ("&&") group already exists here, add the new statements to it
                    else if (Array.isArray(result["&&"]))
                        result["&&"] = [...(!Array.isArray(result["&&"][0]) ? [result["&&"]] : result["&&"]), literal];
                    // Otherwise, define a new joining operator ("&&") property with literal's statements in it
                    else result["&&"] = [literal];
                }
            }
            
            // Handle "words" in the filter (a.k.a. attributes)
            if (type === "Word") {
                // Put the result back on the stack if it's not already there
                if (operator !== "not" && !Array.isArray(literal)) results.push(result);
                
                // Convert literal name into proper camelCase and expand into individual property names
                let literals = literal.split(".").map(l => `${l[0].toLowerCase()}${l.slice(1)}`),
                    target;
                
                // Peek at the next token to see if it's a comparator
                if (tokens[0]?.type === "Comparator") {
                    // If so, get the comparator (the next token)
                    let {value: comparator} = tokens.shift(),
                        // If the comparator expects a value to compare against, get it
                        {value} = (!["pr", "np"].includes(comparator) ? tokens.shift() : {});
                    
                    // Save the comparator and value to the attribute
                    target = [comparator, ...(value !== undefined ? [value] : [])];
                    
                // Peek at the next token's value to see if the word opens a group
                } else if (Array.isArray(tokens[0]?.value)) {
                    // If so, get the group, and collapse or store it in the result
                    let {value} = tokens.shift();
                    target = (value.length === 1 ? value.pop() ?? {} : value);
                }
                
                // Go through all nested attribute names
                while (literals.length > 1) {
                    // TODO: what if there's a collision?
                    let key = literals.shift();
                    result = (result[key] = result[key] ?? {});
                }
                
                // Then assign the targeted value to the nested location
                result[literals.shift()] = target;
            }
        }
        
        return results;
    }
}