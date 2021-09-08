const operators = ["and", "or", "not"];
const comparators = ["eq", "ne", "co", "sw", "ew", "gt", "lt", "ge", "le", "pr"];
const patterns = /^(?:(\s+)|(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)|("(?:[^"]|\\.|\n)*")|(\[(?:.*?)\]|\((?:.*?)\))|(\w[-\w\._:\/%]*))/;

export class Resource {
    constructor(params = {}) {
        if (params.filter) {
            this.filter = Resource.parseFilter(params.filter);
        }
    }
    
    static parseFilter(query = "") {
        let results = [],
            tokens = [],
            token;
        
        while (token = patterns.exec(query)) {
            let [literal, space, number, string, grouping, word] = token;
            
            if (!space) {
                if (number !== undefined) tokens.push({value: number, type: "Number"});
                if (string !== undefined) tokens.push({value: string.substring(1, string.length-1), type: "Value"});
                if (word !== undefined) tokens.push({
                    value: word,
                    type: (operators.includes(word) ? "Operator" : (comparators.includes(word) ? "Comparator" : "Word"))
                });
                
                if (grouping !== undefined) tokens.push({
                    value: Resource.parseFilter(grouping.substring(1, grouping.length - 1))
                });
            }
            
            query = query.substring(token.index + literal.length);
        }
        
        if (query.length > 0) {
            let reason = `Unexpected token '${query}' in filter`;
            if (query.startsWith("(")) reason = `Missing closing ')' token in filter '${query}'`;
            if (query.startsWith("[")) reason = `Missing closing ']' token in filter '${query}'`;
            throw new Error(reason);
        }
        
        while (tokens.length > 0) {
            let {value: literal, type} = tokens.shift(),
                result = {},
                operator;
            
            if (type === undefined && Array.isArray(literal)) {
                results.push(literal.length === 1 ? literal.pop() : {"&&": literal});
            }
            
            if (type === "Operator") {
                operator = literal;
                
                if (operator === "and" && results.length > 0) result = results.pop();
                if (tokens[0]?.type === "Operator" && tokens[0]?.value === "not") {
                    ({value: operator} = tokens.shift());
                    results.push(result);
                    result = result["!!"] = Array.isArray(tokens[0]?.value) ? [] : {};
                }
                
                ({value: literal, type} = tokens.shift());
                
                if (Array.isArray(literal)) {
                    if (operator !== "not") results.push(result);
                    if (literal.length === 1) Object.assign(result, literal.pop());
                    else if (operator === "not") result.splice(0, 0, ...literal);
                    else if (Array.isArray(result["&&"])) {
                        result["&&"] = [...(!Array.isArray(result["&&"][0]) ? [result["&&"]] : result["&&"]), literal];
                    } else {
                        result["&&"] = [literal];
                    }
                }
            }
            
            if (type === "Word") {
                if (tokens[0]?.type === "Comparator") {
                    let {value: comparator} = tokens.shift(),
                        {value} = (comparator !== "pr" ? tokens.shift() : {});
        
                    result[literal] = [comparator, ...(value !== undefined ? [value] : [])];
                } else if (Array.isArray(tokens[0]?.value)) {
                    let {value} = tokens.shift();
                    result[literal] = (value.length === 1 ? value.pop() : value);
                }
                
                if (operator !== "not" && !Array.isArray(literal)) results.push(result);
            }
        }
        
        return results;
    }
}