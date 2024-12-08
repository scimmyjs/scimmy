import Types from "./types.js";
import Schemas from "./schemas.js";
import {User} from "./resources/user.js";
import {Group} from "./resources/group.js";
import {Schema} from "./resources/schema.js";
import {ResourceType} from "./resources/resourcetype.js";
import {ServiceProviderConfig} from "./resources/spconfig.js";

// Export classes for direct consumption
export {User, Group, Schema, ResourceType, ServiceProviderConfig};

/**
 * SCIMMY Resources Container Class
 * @module scimmy/resources
 * @namespace SCIMMY.Resources
 * @description
 * SCIMMY provides a singleton class, `SCIMMY.Resources`, that is used to declare resource types implemented by a SCIM Service Provider.
 * It also provides access to supplied implementations of core resource types that can be used to easily support well-known resource types.  
 * It is also used to retrieve a service provider's declared resource types to be sent via the ResourceTypes HTTP endpoint.
 * 
 * > **Note:**  
 * > The `SCIMMY.Resources` class is a singleton, which means that declared resource types
 * > will remain the same, regardless of where the class is accessed from within your code.
 * 
 * ## Declaring Resource Types
 * Resource type implementations can be declared by calling `{@link SCIMMY.Resources.declare}`.
 * This method will add the given resource type implementation to the list of declared resource types, and automatically
 * declare the resource type's schema, and any schema extensions it may have, to the `{@link SCIMMY.Schemas}` class.
 * ```
 * // Declare several resource types at once
 * SCIMMY.Resources.declare(SCIMMY.Resources.User, {}).declare(SCIMMY.Resources.Group, {});
 * ```
 * 
 * Once declared, resource type implementations are made available to the `{@link SCIMMY.Resources.ResourceType}`
 * resource type, which handles formatting them for transmission/consumption according to the ResourceType schema
 * set out in [RFC7643§6](https://datatracker.ietf.org/doc/html/rfc7643#section-6).
 * 
 * Each resource type implementation must be declared with a unique name, and each name can only be declared once.
 * Attempting to declare a resource type with a name that has already been declared will throw a TypeError with the 
 * message `"Resource '<name>' already declared"`, where `<name>` is the name of the resource type.
 * 
 * Similarly, each resource type implementation can only be declared under one name.
 * Attempting to declare an existing resource type under a new name will throw a TypeError with the message
 * `"Resource '<name>' already declared with name '<existing>'"`, where `<name>` and `<existing>` are the targeted name
 * and existing name, respectively, of the resource type.
 * 
 * ```
 * // Declaring a resource type under a different name
 * class User extends SCIMMY.Types.Resource {/ Your resource type implementation /}
 * SCIMMY.Resources.declare(User, "CustomUser");
 * ```
 * 
 * ### Extending Resource Types
 * With the exception of the `ResourceType`, `Schema`, and `ServiceProviderConfig` resources, resource type implementations
 * can have schema extensions attached to them via the `{@link SCIMMY.Types.Resource.extend extend}` method inherited from
 * the `{@link SCIMMY.Types.Resource}` class. Schema extensions added to resource type implementations will automatically
 * be included in the `schemaExtensions` attribute when formatted by the `ResourceType` resource, and the extension's
 * schema definition declared to the `{@link SCIMMY.Schemas}` class.
 * 
 * Resource type implementations can be extended:
 * *   At the time of declaration via the declaration config object:
 *     ```
 *     // Add the EnterpriseUser schema as a required extension at declaration
 *     SCIMMY.Resources.declare(SCIMMY.Resources.User, {
 *          extensions: [{schema: SCIMMY.Schemas.EnterpriseUser, required: true}]
 *     });
 *     ```
 * *   Immediately after declaration via the resource's `{@link SCIMMY.Types.Resource.extend extend}` method:
 *     ```
 *     // Add the EnterpriseUser schema as a required extension after declaration
 *     SCIMMY.Resources.declare(SCIMMY.Resources.User).extend(SCIMMY.Schemas.EnterpriseUser, true);
 *     ```
 * *   Before or during declaration, directly on the resource, via the resource's `{@link SCIMMY.Types.Resource.extend extend}` method:
 *     ```
 *     // Add the EnterpriseUser schema as an optional extension before declaration
 *     SCIMMY.Resources.User.extend(SCIMMY.Schemas.EnterpriseUser, false);
 *     SCIMMY.Resources.declare(SCIMMY.Resources.User);
 *     
 *     // Add the EnterpriseUser schema as a required extension during declaration
 *     SCIMMY.Resources.declare(SCIMMY.Resources.User.extend(SCIMMY.Schemas.EnterpriseUser, true));
 *     ```
 * *   Any time after declaration, directly on the retrieved resource, via the resource's `{@link SCIMMY.Types.Resource.extend extend}` method:
 *     ```
 *     // Add the EnterpriseUser schema as a required extension after declaration
 *     SCIMMY.Resources.declared("User").extend(SCIMMY.Schemas.EnterpriseUser, true);
 *     ```
 * 
 * ## Retrieving Declared Types
 * Declared resource type implementations can be retrieved via the `{@link SCIMMY.Resources.declared}` method.
 * *   All currently declared resource types can be retrieved by calling the method with no arguments.  
 *     ```
 *     // Returns a cloned object with resource type names as keys, and resource type implementation classes as values
 *     SCIMMY.Resources.declared();
 *     ```
 * *   Specific declared implementations can be retrieved by calling the method with the resource type name string.
 *     This will return the same resource type implementation class that was previously declared.  
 *     ```
 *     // Returns the declared resource matching the specified name, or undefined if no resource matched the name
 *     SCIMMY.Resources.declared("MyResourceType");
 *     ```
 * 
 * @example <caption>Basic usage with provided resource type implementations</caption>
 * SCIMMY.Resources.declare(SCIMMY.Resources.User)
 *      .ingress((resource, data) => {/ Your handler for creating or modifying user resources /})
 *      .egress((resource) => {/ Your handler for retrieving user resources /})
 *      .degress((resource) => {/ Your handler for deleting user resources /});
 * @example <caption>Advanced usage with custom resource type implementations</caption>
 * SCIMMY.Resources.declare(class MyResourceType extends SCIMMY.Types.Resource {
 *      read() {/ Your handler for retrieving resources /})
 *      write(data) {/ Your handler for creating or modifying resources /}
 *      dispose() {/ Your handler for deleting resources /})
 *      // ...the rest of your resource type implementation //
 * });
*/
export default class Resources {
    /**
     * Store internal resources to prevent declaration
     * @private
     */
    static #internals = [Schema, ResourceType, ServiceProviderConfig];
    /**
     * Store declared resources for later retrieval 
     * @private 
     */
    static #declared = {};
    
    // Expose built-in resources without "declaring" them
    static Schema = Schema;
    static ResourceType = ResourceType;
    static ServiceProviderConfig = ServiceProviderConfig;
    static User = User;
    static Group = Group;
    
    /**
     * Register a resource implementation and return it for chained configuration
     * @template {typeof SCIMMY.Types.Resource<any>} R
     * @overload
     * @param {R} resource - the resource type implementation to register
     * @param {String} [config] - the explicit name to register the resource implementation with
     * @returns {R} the registered resource type class for chaining
     */
    /**
     * Register a resource implementation with specific config, returning Resources class for chained registrations
     * @template {typeof SCIMMY.Types.Resource<any>} R
     * @overload
     * @param {R} resource - the resource type implementation to register
     * @param {Object} config - the configuration to feed to the resource being registered
     * @returns {typeof SCIMMY.Resources} the Resources class for chaining
     */
    /**
     * Register a resource implementation for exposure as a ResourceType
     * @param {typeof SCIMMY.Types.Resource} resource - the resource type implementation to register
     * @param {Object|String} [config] - the configuration to feed to the resource being registered, or the name of the resource type implementation if different to the class name
     * @returns {typeof SCIMMY.Resources|typeof SCIMMY.Types.Resource} the Resources class or registered resource type class for chaining
     */
    static declare(resource, config) {
        // Make sure the registering resource is valid
        if (!resource || !(resource.prototype instanceof Types.Resource))
            throw new TypeError("Registering resource must be of type 'Resource'");
        // Make sure config is valid, if supplied
        if (config !== undefined && (typeof config !== "string" && (typeof config !== "object" || Array.isArray(config))))
            throw new TypeError("Resource declaration expected 'config' parameter to be either a name string or configuration object");
        // Refuse to declare internal resources
        if (Resources.#internals.includes(resource))
            throw new TypeError(`Refusing to declare internal resource implementation '${resource.name}'`);
        
        // Source name from resource if config is an object
        let name = (typeof config === "string" ? config : resource?.name);
        if (typeof config === "object") name = config.name ?? name;
        
        // Prevent registering a resource implementation under a name that already exists
        if (!!Resources.#declared[name] && Resources.#declared[name] !== resource)
            throw new TypeError(`Resource '${name}' already declared`);
        // Prevent registering an existing resource implementation under a different name
        else if (Object.values(Resources.#declared).some(r => r === resource) && Resources.#declared[name] !== resource)
            throw new TypeError(`Resource '${name}' already declared with name '${Object.entries(Resources.#declared).find(([n, r]) => r === resource).shift()}'`);
        // All good, register the resource implementation
        else if (!Resources.#declared[name])
            Resources.#declared[name] = resource;
        
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
     * Get all registered resource implementations
     * @overload
     * @returns {Record<String, typeof SCIMMY.Types.Resource>} a containing object with all registered resource implementations
     */
    /**
     * Get the registered resource type implementation for the given name
     * @overload
     * @param {String} resource - registered name of resource to retrieve
     * @returns {typeof SCIMMY.Types.Resource} the registered resource type implementation with matching name
     */
    /**
     * Query the registration status of a given resource type implementation
     * @template {typeof SCIMMY.Types.Resource<any>} R
     * @overload
     * @param {R} resource - the resource type implementation to query registration status for
     * @returns {Boolean} the registration status of the specified resource type implementation class
     */
    /**
     * Get registration status of specific resource implementation, or get all registered resource implementations
     * @param {typeof SCIMMY.Types.Resource|String} [resource] - the resource implementation or name to query registration status for
     * @returns {Record<String, typeof SCIMMY.Types.Resource>|typeof SCIMMY.Types.Resource|Boolean}
     * *   A containing object with registered resource implementations for exposure as ResourceTypes, if no arguments are supplied.
     * *   The registered resource type implementation with matching name, or undefined, if a string argument is supplied.
     * *   The registration status of the specified resource implementation, if a class extending `SCIMMY.Types.Resource` is supplied.
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