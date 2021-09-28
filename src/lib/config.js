import {ServiceProviderConfig} from "./schemas.js";

// Define handler traps for returned proxied configuration object
const catchAll = () => {throw new TypeError("SCIM Configuration can only be changed via the 'set' method")};
const handleTraps = {set: catchAll, deleteProperty: catchAll, defineProperty: catchAll};

/**
 * SCIM Service Provider Configuration Container Class
 */
export default class Config {
    // Store the configuration
    static #config = {
        patch: Object.preventExtensions({supported: false}),
        bulk: Object.preventExtensions({supported: false, maxOperations: 1000, maxPayloadSize: 1048576}),
        filter: Object.preventExtensions({supported: false, maxResults: 200}),
        changePassword: Object.preventExtensions({supported: false}),
        sort: Object.preventExtensions({supported: false}),
        etag: Object.preventExtensions({supported: false}),
        authenticationSchemes: []
    };
    
    /**
     * Get SCIM service provider configuration
     * @return {Object} the service provider configuration, proxied for protection
     */
    static get() {
        // Wrap all the things in a proxy!
        return new Proxy(Object.entries(Config.#config)
            .reduce((res, [key, value]) => ((res[key] = new Proxy(value, handleTraps)) && res), {}), handleTraps);
    }
    
    /**
     * Set SCIM service provider configuration
     * @param {Object} [args[0]] - the new configuration to apply to the service provider config instance
     * @param {String} [args[0]] - the name of the configuration property to set
     * @param {Object|Boolean} [args[1]] - the new value of the configuration property to set
     * @return {Object|Config} the updated configuration instance, or the config container class for chaining
     */
    static set(...args) {
        // Dereference name and config from supplied parameters
        let [name, config = args[0]] = args;
        
        // If property name supplied, call again with object
        if (typeof name === "string") {
            Config.set({[name]: config});
            
            return Config;
        }
        // If name was omitted, assume config is for top-level assignment
        else if (config === name && config === Object(config)) {
            // Make sure all property names are valid
            for (let key of Object.keys(config)) {
                if (!(key in Config.#config))
                    throw new TypeError(`SCIM configuration: schema does not define attribute '${key}'`);
            }
            
            // They must be valid, so apply them to the config
            for (let [key, value] of Object.entries(config)) {
                let target = Config.#config[key];
                
                if (Array.isArray(target)) {
                    // Target is multi-valued (authenticationSchemes), add coerced values to config
                    target.push(...ServiceProviderConfig.definition.attribute(key).coerce(Array.isArray(value) ? value : [value]));
                } else {
                    // Strings are not valid shorthand config values
                    if (typeof value === "string")
                        throw new TypeError(`SCIM configuration: attribute '${key}' expected value type 'complex' but got 'string'`);
                    // Booleans are valid shorthand for {supported: true}
                    else if (typeof value === "boolean")
                        target.supported = value;
                    // Numbers are valid shorthand for filter (maxResults) and bulk (maxOperations) config values
                    else if (typeof value === "number") {
                        // Expect key to be bulk or filter
                        if (!["bulk", "filter"].includes(key))
                            throw new TypeError(`SCIM configuration: property '${key}' does not define any number-based attributes`);
                        
                        // Expect number to not be negative
                        if (value < 0)
                            throw new TypeError(`SCIM configuration: property '${key}' expects number value to be zero or more`);
                        
                        // Toggle support and assign relevant config value
                        target.supported = (!!value && value >= 0);
                        target[key === "filter" ? "maxResults" : "maxOperations"] = value;
                    }
                    // No shorthand, make sure value is an object
                    else if (value === Object(value)) {
                        try {
                            // Coerce the value and assign it to the config property
                            Object.assign(target, ServiceProviderConfig.definition.attribute(key)
                                .coerce({...target, supported: true, ...value}));
                        } catch (ex) {
                            // Rethrow exceptions after giving them better context
                            ex.message = "SCIM configuration: " + ex.message[0].toLowerCase() + ex.message.slice(1);
                            throw ex;
                        }
                    }
                }
            }
        }
        
        // Return the new config
        return Config.get();
    }
}