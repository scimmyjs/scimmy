import {Resource} from "./types/resource.js";
import {User} from "./resources/user.js";
import {Group} from "./resources/group.js";
import {Schema} from "./resources/schema.js";
import {ResourceType} from "./resources/resourcetype.js";

/**
 * SCIM Resources Container Class
 */
class Resources {
    // Store registered resources for later retrieval
    static #resources = {};
    
    // Expose built-in resources without "registering" them
    static Schema = Schema;
    static ResourceType = ResourceType;
    static User = User;
    static Group = Group;
    
    /**
     * Register a resource implementation for exposure as a ResourceType
     * @param {Resource} resource - the resource to register
     * @param {String} [name] - the name of the resource being registered
     * @returns {Resource} the registered resource class for chaining
     */
    static register(resource, name) {
        // Make sure the registering resource is valid
        if (!resource || !(resource.prototype instanceof Resource))
            throw new TypeError("Registering resource must be of type 'Resource'");
        
        // Source name from resource if not defined
        if (name === undefined) name = resource.name;
        
        // Prevent registering a resource implementation that already exists
        if (!!Resources.#resources[name]) throw new TypeError(`Resource '${name}' already registered`);
        else Resources[name] = Resources.#resources[name] = resource;
        
        return resource;
    }
    
    /**
     * Get registration status of specific resource implementation, or get all registered resource implementations
     * @param {Resource|String} [resource] - the resource implementation or name to query registration status for
     * @returns {Object|Boolean}
     *   - {Object} Containing object with registered resource implementations for exposure as ResourceTypes
     *   - {Boolean} the registration status of the specified resource implementation
     */
    static registered(resource) {
        if (!resource) return {...Resources.#resources};
        else if (!(resource.prototype instanceof Resource)) return false;
        else return Resources.#resources[typeof resource === "string" ? resource : resource.name] === resource;
    }
}

export default Resources;