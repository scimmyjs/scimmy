import {SchemaDefinition} from "./types.js";
import {User} from "./schemas/user.js";
import {Group} from "./schemas/group.js";
import {EnterpriseUser} from "./schemas/enterpriseuser.js";
import {ResourceType} from "./schemas/resourcetype.js";
import {ServiceProviderConfig} from "./schemas/spconfig.js";
export {User, Group, EnterpriseUser, ResourceType, ServiceProviderConfig};

/**
 * SCIM Schemas Container Class
 */
export default class Schemas {
    // Store declared schema definitions for later retrieval
    static #definitions = {};
    
    // Expose built-in schemas without "declaring" them
    static User = User;
    static Group = Group;
    static EnterpriseUser = EnterpriseUser;
    static ResourceType = ResourceType;
    static ServiceProviderConfig = ServiceProviderConfig;
    
    /**
     * Register a SchemaDefinition implementation for exposure via Schemas HTTP endpoint
     * @param {SchemaDefinition} definition - the schema definition to register
     * @param {String|Object} [config] - the configuration to feed to the schema being declared
     * @returns {SchemaDefinition|Schemas} the Schemas class or declared schema class for chaining
     */
    static declare(definition, config) {
        // Source name from schema definition if config is an object
        let name = (typeof config === "string" ? config : definition.name).replace(/\s+/g, "");
        if (typeof config === "object") name = config.name ?? name;
        
        // Make sure the registering schema is valid
        if (!definition || !(definition instanceof SchemaDefinition))
            throw new TypeError("Registering schema definition must be of type 'SchemaDefinition'");
        
        // Prevent registering a schema definition that already exists
        if (!!Schemas.#definitions[name] && Schemas.#definitions[name] !== definition)
            throw new TypeError(`Schema definition '${name}' already declared`);
        else if (!Schemas.#definitions[name])
            Schemas[name] = Schemas.#definitions[name] = definition;
        
        // If config was supplied, return Schemas, otherwise return the registered schema definition
        return (typeof config === "object" ? Schemas : definition);
    }
    
    /**
     * Get registration status of specific schema implementation, or get all registered schema definitions
     * @param {SchemaDefinition|String} [definition] - the schema implementation or name to query registration status for
     * @returns {Object|SchemaDefinition|Boolean}
     *   - {Object} containing object with declared schema definitions for exposure via Schemas HTTP endpoint
     *   - {SchemaDefinition} the registered schema definition with matching name or ID
     *   - {Boolean} the registration status of the specified schema implementation
     */
    static declared(definition) {
        // If no definition specified, return declared schema definitions
        if (!definition) {
            // Prepare to check if there are any undeclared extensions
            let definitions = Object.entries(Schemas.#definitions).map(([,d]) => d);
            
            // Get any undeclared schema definition extensions
            for (let e of [...new Set(definitions.map(d => d.attributes.filter(a => a instanceof SchemaDefinition))
                .flat(Infinity).map(e => Object.getPrototypeOf(e)))].filter(e => !Schemas.declared(e))) {
                // ...and declare them
                Schemas.declare(e);
            }
            
            // If there were any newly declared definitions, reevaluate declarations
            if (definitions.length !== Object.keys(Schemas.#definitions).length)
                return Schemas.declared();
            // Otherwise just return the declared definitions
            else return {...Schemas.#definitions};
        }
        // If definition is a string, find and return the matching schema definition
        else if (typeof definition === "string") {
            // Try definition as declaration name, then try definition as declaration id or declared instance name
            return Schemas.#definitions[definition] ?? Object.entries(Schemas.#definitions)
                .map(([, d]) => d).find((d) => [d?.id, d?.name].includes(definition));
        }
        // If the definition is an instance of SchemaDefinition, see if it is already declared
        else if (definition instanceof SchemaDefinition) return Schemas.#definitions[definition.constructor.name] === definition;
        // Otherwise, the schema definition isn't declared...
        else return false;
    }
}