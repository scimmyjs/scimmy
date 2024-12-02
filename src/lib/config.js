import {ServiceProviderConfig} from "./schemas.js";

// Define handler traps for returned proxied configuration object
const catchAll = () => {throw new TypeError("SCIM Configuration can only be changed via the 'set' method")};
const handleTraps = {set: catchAll, deleteProperty: catchAll, defineProperty: catchAll};

/**
 * SCIMMY Service Provider Configuration Class
 * @module scimmy/config
 * @namespace SCIMMY.Config
 * @description
 * SCIMMY provides a singleton class, `SCIMMY.Config`, that acts as a central store for a SCIM Service Provider's configuration.  
 * It is used for defining SCIM specification features supported (e.g. PATCH, sort, filter, etc).  
 * This can be either directly by an implementing service provider, or retrieved by a client (identity provider) from a remote service provider.  
 * By default, all specification features are marked as disabled, as your implementation may not support them.
 *
 * ## Retrieving Configuration
 * The stored configuration can be retrieved by calling `{@link SCIMMY.Config.get}()`, which returns a cloned object 
 * representing the configuration _at the time of retrieval_.
 *
 * > **Note:**  
 * > To prevent accidental configuration changes, the returned object has been trapped, and attempting to change a configuration 
 * > value directly on this object will throw a TypeError with the message `"SCIM Configuration can only be changed via the 'set' method"`
 *
 * The structure of the object reflects the example provided in [RFC7643§8.5](https://datatracker.ietf.org/doc/html/rfc7643#section-8.5):
 * ```json
 * {
 *    "documentationUri": "/path/to/documentation.html",
 *    "patch": {
 *        "supported": false
 *    },
 *    "bulk": {
 *        "supported": false,
 *        "maxOperations": 1000,
 *        "maxPayloadSize": 1048576
 *    },
 *    "filter": {
 *        "supported": false,
 *        "maxResults": 200
 *    },
 *    "changePassword": {
 *        "supported": false
 *    },
 *    "sort": {
 *        "supported": false
 *    },
 *    "etag": {
 *        "supported": false
 *    },
 *    "authenticationSchemes": []
 * }
 * ```
 *
 * ## Setting Configuration
 * The stored configuration can be changed via the `{@link SCIMMY.Config.set}` method. This method can be called either with an object representing the new configuration, or with a configuration property name string and value pair.
 * *   Where the only child property of a top-level configuration property is "supported", a boolean can be supplied as the value, which will be used as the value of the "supported" property.
 *     ```js
 *     // This will set patch.supported to true
 *     SCIMMY.Config.set("patch", true);
 *     ```
 * *   The "filter" and "bulk" properties also accept a number value, which will be interpreted as being the value of the "maxResults" and "maxOperations" child properties respectively, and will automatically set "supported" to true.
 *     ```js
 *     // This will set filter.maxResults to 20, and filter.supported to true
 *     SCIMMY.Config.set("filter", 20);
 *     ```
 *
 * > **Note:**  
 * > Supplied values are validated against SCIMMY's ServiceProviderConfig schema definition.  
 * > Providing values with incompatible types (e.g. the string "100" instead of the number 100) will throw a TypeError.  
 * > This ensures configuration values always conform to the standard. See [RFC7643§5](https://datatracker.ietf.org/doc/html/rfc7643#section-5) for more information.
 *
 * Multiple values can also be set at the same time, and changes are cumulative, so omitted properties will not be unset:
 * ```js
 * // With both shorthand and full syntax
 * SCIMMY.Config.set({
 *    documentationUri: "https://example.com/docs/scim.html",
 *    patch: true,
 *    filter: 100,
 *    bulk: {
 *        supported: true,
 *        maxPayloadSize: 2097152
 *    },
 *    authenticationSchemes: [
 *        {/ Your authentication scheme details /}
 *    ]
 * });
 * ```
 *
 * ### Authentication Schemes
 * Service provider authentication schemes can be set in the same way as other configuration properties, and are cumulative.  
 * The authenticationSchemes collection can be reset by providing an empty array as the value for the authenticationSchemes property.
 * ```js
 * // Both of these will append the supplied values to the authenticationSchemes property
 * SCIMMY.Config.set("authenticationSchemes", {/ Your authentication scheme details /});
 * SCIMMY.Config.set("authenticationSchemes", [
 *      {/ Your primary authentication scheme details /},
 *      {/ Your secondary authentication scheme details /}
 * ]);
 *
 * // Reset the authenticationSchemes collection
 * SCIMMY.Config.set("authenticationSchemes", []);
 * ```
 */
export default class Config {
    /**
     * Store the configuration
     * @private
     */
    static #config = {
        documentationUri: undefined,
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
     * @returns {Object} the service provider configuration, proxied for protection
     */
    static get() {
        // Wrap all the things in a proxy!
        return new Proxy(Object.entries(Config.#config).reduce((res, [key, value]) => Object.assign(res, {
            [key]: (key === "documentationUri" ? value : new Proxy(value, handleTraps))
        }), {}), handleTraps);
    }
    
    /**
     * Set multiple SCIM service provider configuration property values
     * @overload
     * @param {Object} config - the new configuration to apply to the service provider config instance
     * @returns {Object} the updated configuration instance
     */
    /**
     * Set specific SCIM service provider configuration property by name
     * @overload
     * @param {String} name - the name of the configuration property to set
     * @param {Object|Boolean} value - the new value of the configuration property to set
     * @returns {typeof SCIMMY.Config} the config container class for chaining
     */
    /**
     * Set SCIM service provider configuration
     * @param {Object|String} name - the configuration key name or value to apply
     * @param {Object|String|Boolean} [config=name] - the new configuration to apply to the service provider config instance
     * @returns {Object|typeof SCIMMY.Config} the updated configuration instance, or the config container class for chaining
     */
    static set(name, config = name) {
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
                
                if (key === "documentationUri") {
                    // documentationUri must be a string
                    if (!!value && String(value) !== value)
                        throw new TypeError("SCIM configuration: attribute 'documentationUri' expected value type 'string'");
                    
                    // Assign documentationUri string
                    if (!!value) Config.#config.documentationUri = ServiceProviderConfig.definition.attribute(key).coerce(value);
                    else Config.#config.documentationUri = undefined;
                } else if (Array.isArray(target)) {
                    // Target is multi-valued (authenticationSchemes), add coerced values to config, or reset if empty
                    if (!value || (Array.isArray(value) && value.length === 0)) target.splice(0);
                    else target.push(...ServiceProviderConfig.definition.attribute(key).coerce(Array.isArray(value) ? value : [value]));
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
                            // Make sure all object keys correspond to valid config attributes
                            for (let name of Object.keys(value)) ServiceProviderConfig.definition.attribute(`${key}.${name}`);
                            
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