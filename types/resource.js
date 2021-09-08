import {SCIMError} from "./error.js";

// Logic Operators
const operators = ["and", "or", "not"];
// Comparison Operations
const comparators = ["eq", "ne", "co", "sw", "ew", "gt", "lt", "ge", "le", "pr"];
// Parsing Pattern Matcher
const patterns = /^(?:(\s+)|(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)|("(?:[^"]|\\.|\n)*")|(\[(?:.*?)\]|\((?:.*?)\))|(\w[-\w\._:\/%]*))/;

/**
 * SCIM Resource
 * @interface
 */
export class Resource {
    /**
     * Instantiate a new SCIM resource and parse any supplied parameters
     * @param {Object|String} [config={}] - the parameters of the resource instance if object, or the resource ID if string
     * @param {String} [config.filter] - the filter to be applied on ingress by implementing resource
     * @param {*[]} [rest] - all other arguments supplied to the resource constructor
     */
    constructor(config = {}, ...rest) {
        let params = config;
        
        if (typeof config === "string") {
            this.id = config;
            params = rest.shift() ?? {};
            params.filter = `id eq "${this.id}"`;
        }
        
        if (params.filter) this.filter = Resource.#parseFilter(params.filter);
    }
    
    /**
     * Calls resource's egress method and wraps the results in valid SCIM list response or single resource syntax
     * @abstract
     */
    read() {
        throw new TypeError("Method 'read' must be implemented by subclass");
    }
    
    /**
     * Calls resource's ingress method for consumption after unwrapping the SCIM resource
     * @abstract
     */
    write() {
        throw new TypeError("Method 'readOne' must be implemented by subclass");
    }
    
    /**
     * Parse a SCIM filter string into an array of objects representing the query filter
     * @param {String} [query=""] - the filter parameter of a request as per [RFC7644§3.4.2.2]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2}
     * @returns {Object[]} parsed object representation of the queried filter
     */
    static #parseFilter(query = "") {
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
                    type: "Group", value: Resource.#parseFilter(grouping.substring(1, grouping.length - 1))
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
                // Peek at the next token to see if it's a comparator
                if (tokens[0]?.type === "Comparator") {
                    // If so, get the comparator (the next token)
                    let {value: comparator} = tokens.shift(),
                        // If the comparator expects a value to compare against, get it
                        {value} = (comparator !== "pr" ? tokens.shift() : {});
                    
                    // Save the comparator and value to the attribute
                    result[literal] = [comparator, ...(value !== undefined ? [value] : [])];
                    
                // Peek at the next token's value to see if the word opens a group
                } else if (Array.isArray(tokens[0]?.value)) {
                    // If so, get the group, and collapse or store it in the result
                    let {value} = tokens.shift();
                    result[literal] = (value.length === 1 ? value.pop() ?? {} : value);
                }
                
                // Put the result back on the stack if it's not already there
                if (operator !== "not" && !Array.isArray(literal)) results.push(result);
            }
        }
        
        return results;
    }
    
    /**
     * Handler for ingress/egress of a resource
     * @callback Resource~gressHandler
     * @param {Resource} - the resource performing the ingress/egress
     */
    
    /**
     * Ingress handler storage property
     * @abstract
     */
    static #ingress;
    
    /**
     * Sets the method to be called to retrieve a resource on read
     * @param {Resource~gressHandler} handler - function to invoke to retrieve a resource on read
     * @abstract
     */
    static ingress(handler) {
        throw new TypeError("Method 'ingress' must be implemented by subclass");
    }
    
    /**
     * Egress handler storage property
     * @abstract
     */
    static #egress;
    
    /**
     * Sets the method to be called to consume a resource on write
     * @param {Resource~gressHandler} handler - function to invoke to retrieve a resource on read
     * @abstract
     */
    static egress(handler) {
        throw new TypeError("Method 'egress' must be implemented by subclass");
    }
}