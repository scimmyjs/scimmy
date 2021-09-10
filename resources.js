import {User} from "./resources/user.js";
import {Schema} from "./resources/schema.js";
import {ResourceType} from "./resources/resourcetype.js";

/**
 * SCIM Resources Container Class
 */
class Resources {
    // Store registered resources for later retrieval
    static #resources = {};
    
    // Expose Schema and ResourceType resources without "registering" them
    static Schema = Schema;
    static ResourceType = ResourceType;
    
    /**
     * Register a resource implementation for exposure as a ResourceType
     * @param {Resource} resource - the resource to register
     * @param {String} [name] - the name of the resource being registered
     * @returns {Resources} the Resources class for chaining
     */
    static register(resource, name) {
        // Source name from resource if not defined
        if (name === undefined) name = resource.name;
        
        // Prevent registering a resource implementation that already exists
        if (!!Resources.#resources[name]) throw new TypeError(`Resource '${name}' already registered`);
        else Resources[name] = Resources.#resources[name] = resource;
        
        return Resources;
    }
    
    /**
     * Get all registered resource implementations for exposure as ResourceTypes
     * @returns {Object} containing object with registered resource implementations
     */
    static registered() {
        return {...Resources.#resources};
    }
}

// Register default resource implementations
Resources.register(User);

export default Resources;