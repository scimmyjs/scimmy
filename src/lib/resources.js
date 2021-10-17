import {User} from "./resources/user.js";
import {Group} from "./resources/group.js";
import {Schema} from "./resources/schema.js";
import {ResourceType} from "./resources/resourcetype.js";
import {ServiceProviderConfig} from "./resources/spconfig.js";
import Types from "./types.js";
import Schemas from "./schemas.js";

/**
 * SCIM Resources Container Class
 * @namespace SCIMMY.Resources
 */
export default class Resources {
    // Store declared resources for later retrieval
    /** @private */
    static #declared = {};
    
    // Expose built-in resources without "declaring" them
    static Schema = Schema;
    static ResourceType = ResourceType;
    static ServiceProviderConfig = ServiceProviderConfig;
    static User = User;
    static Group = Group;
    
    /**
     * Register a resource implementation for exposure as a ResourceType
     * @param {SCIMMY.Types.Resource} resource - the resource to register
     * @param {String|Object} [config] - the configuration to feed to the resource being registered
     * @returns {SCIMMY.Types.Resource|SCIMMY.Resources} the Resources class or registered resource class for chaining
     */
    static declare(resource, config) {
        // Source name from resource if config is an object
        let name = (typeof config === "string" ? config : resource.name);
        if (typeof config === "object") name = config.name ?? name;
        
        // Make sure the registering resource is valid
        if (!resource || !(resource.prototype instanceof Types.Resource))
            throw new TypeError("Registering resource must be of type 'Resource'");
        
        // Prevent registering a resource implementation that already exists
        if (!!Resources.#declared[name]) throw new TypeError(`Resource '${name}' already registered`);
        else Resources[name] = Resources.#declared[name] = resource;
        
        // Set up the resource if a config object was supplied
        if (typeof config === "object") {
            // Register supplied basepath
            if (typeof config.basepath === "string")
                Resources.#declared[name].basepath(config.basepath);
            
            // Register supplied ingress, egress, and degress methods
            if (typeof config.ingress === "function")
                Resources.#declared[name].ingress(async (...r) => await config.ingress(...r))
            if (typeof config.egress === "function")
                Resources.#declared[name].egress(async (...r) => await config.egress(...r))
            if (typeof config.degress === "function")
                Resources.#declared[name].degress(async (...r) => await config.degress(...r))
            
            // Register any supplied schema extensions
            if (Array.isArray(config.extensions)) {
                for (let {schema, attributes, required} of config.extensions) {
                    Resources.#declared[name].extend(schema ?? attributes, required);
                }
            }
        }
        
        // Declare the resource type implementation's schema!
        Schemas.declare(resource.schema.definition);
        
        // If config was supplied, return Resources, otherwise return the registered resource
        return (typeof config === "object" ? Resources : resource);
    }
    
    /**
     * Get registration status of specific resource implementation, or get all registered resource implementations
     * @param {SCIMMY.Types.Resource|String} [resource] - the resource implementation or name to query registration status for
     * @returns {Object|SCIMMY.Types.Resource|Boolean}
     *   - {Object} containing object with registered resource implementations for exposure as ResourceTypes
     *   - {SCIMMY.Types.Resource} the registered resource implementation with matching name
     *   - {Boolean} the registration status of the specified resource implementation
     */
    static declared(resource) {
        // If no resource specified, return declared resources
        if (!resource) return {...Resources.#declared};
        // If resource is a string, find and return the matching resource type
        else if (typeof resource === "string") return Resources.#declared[resource];
        // If the resource is an instance of Resource, see if it is already registered
        else if (resource.prototype instanceof Types.Resource) return Resources.#declared[resource.name] === resource;
        // Otherwise, the resource isn't registered...
        else return false;
    }
}