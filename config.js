import {ServiceProviderConfig} from "./schemas.js";

/**
 * SCIM Service Provider Configuration Container Class
 */
export default class Config {
    // Store the user-defined configuration
    static #config;
    // Establish the default configuration
    static #preset = new ServiceProviderConfig({
        patch: {supported: false},
        bulk: {supported: false, maxOperations: 1000, maxPayloadSize: 1048576},
        filter: {supported: false, maxResults: 200},
        changePassword: {supported: false},
        sort: {supported: false},
        etag: {supported: false},
        authenticationSchemes: []
    });
    
    /**
     * Set user-defined service provider configuration
     * @param {Object} [config={}] - the new configuration to apply to the service provider config instance
     * @return {ServiceProviderConfig} the updated configuration instance
     */
    static set(config = {}) {
        if (Config.#config === undefined) Config.#config = new ServiceProviderConfig({...Config.#preset, ...config});
        else Object.assign(Config.#config, config);
        return Config.#config;
    }
    
    /**
     * Get user-defined service provider configuration
     * @return {ServiceProviderConfig} the user-defined configuration instance, or the default instance if not defined
     */
    static get() {
        return Config.#config ?? {...Config.#preset};
    }
}