import Types from "./types.js";
import {User} from "./schemas/user.js";
import {Group} from "./schemas/group.js";
import {EnterpriseUser} from "./schemas/enterpriseuser.js";
import {ResourceType} from "./schemas/resourcetype.js";
import {ServiceProviderConfig} from "./schemas/spconfig.js";

/**
 * SCIMMY Schemas Container Class
 * @namespace SCIMMY.Schemas
 * @description
 * SCIMMY provides a singleton class, `SCIMMY.Schemas`, that is used to declare schema definitions implemented by a SCIM Service Provider.
 * It also provides access to supplied implementations of core resource type schema definitions.
 * It is also used to retrieve a service provider's declared schema definitions to be sent via the Schemas HTTP endpoint.
 *
 * > **Note:**  
 * > The `SCIMMY.Schemas` class is a singleton, which means that declared schema definitions
 * > will remain the same, regardless of where the class is accessed from within your code.
 * 
 * ## Declaring Definitions
 * Schema definitions are typically declared automatically at the same time as resource type instances are declared in `{@link SCIMMY.Resources}`.
 * If necessary, schema definitions can be declared manually with the `{@link SCIMMY.Schemas.declare}` method.
 * Nested definitions that extend declared schema definitions are also automatically declared to the `SCIMMY.Schemas` class.
 * ```
 * // Manually declare the EnterpriseUser schema definition
 * SCIMMY.Schemas.declare(SCIMMY.Schemas.EnterpriseUser.definition);
 * ```
 * 
 * Once declared, schema definitions are made available to the `{@link SCIMMY.Resources.Schema}`
 * resource type, which handles formatting them for transmission/consumption according to the Schema Definition schema
 * set out in [RFC7643§7](https://datatracker.ietf.org/doc/html/rfc7643#section-7).
 * 
 * Each schema definition must be declared with a unique name, and each name can only be declared once.
 * Attempting to declare a new schema definition with a name that has already been declared will throw a TypeError with the
 * message `"Schema definition '<name>' already declared with id '<id>'"`, where `<name>` and `<id>` are the name and id,
 * respectively, of the existing schema definition.
 * 
 * Similarly, each schema definition can only be declared under one name.
 * Attempting to declare an existing schema definition under a new name will throw a TypeError with the message 
 * `"Schema definition '<id>' already declared with name '<name>'"`, where `<id>` and `<name>` are the id and name,
 * respectively, of the existing schema definition.
 *
 * ```
 * // Declaring a schema definition under a different name
 * let definition = new SCIMMY.Types.SchemaDefinition("User", "urn:ietf:params:scim:schemas:MyOrg:CustomUser", "MyOrg Custom User");
 * SCIMMY.Schemas.declare(definition, "CustomUser");
 * ```
 *
 * ## Modifying Definitions
 * Not all SCIM clients and service providers support every attribute defined in the SCIM core schemas,
 * and conversely, some custom attributes may not be defined in the core schemas. In such situations,
 * it is possible to modify schema definitions using their `{@link SCIMMY.Types.SchemaDefinition#extend extend}` 
 * and `{@link SCIMMY.Types.SchemaDefinition#truncate truncate}` instance methods.
 * 
 * > **Note:**  
 * > Like the `SCIMMY.Schemas` class, the schema implementations included in this class are all singletons,
 * > and any changes to their schema definitions will persist across any location they are accessed. 
 * 
 * ```
 * // Remove unsupported "name" sub-attributes from the User schema definition
 * SCIMMY.Schemas.User.definition.truncate(["name.middleName", "name.honorificPrefix", "name.honorificSuffix"]);
 * 
 * // Remove unsupported "ims" attribute and its sub-attributes from the User schema
 * SCIMMY.Schemas.User.definition.truncate(["ims"]);
 * 
 * // Add custom "mail" attribute to the Group schema definition
 * SCIMMY.Schemas.Group.definition.extend([new SCIMMY.Types.Attribute("string", "mail", {required: true})]);
 * ```
 */
export default class Schemas {
    // Store declared schema definitions for later retrieval
    static #definitions = new Map();
    static #idsToNames = new Map();
    
    // Expose built-in schemas without "declaring" them
    static User = User;
    static Group = Group;
    static EnterpriseUser = EnterpriseUser;
    static ResourceType = ResourceType;
    static ServiceProviderConfig = ServiceProviderConfig;
    
    /**
     * Register a SchemaDefinition implementation for exposure via Schemas HTTP endpoint
     * @param {SCIMMY.Types.SchemaDefinition} definition - the schema definition to register
     * @param {String} [name] - the name of the definition being declared, if different from definition's name property 
     * @returns {SCIMMY.Schemas} the Schemas class for chaining
     */
    static declare(definition, name) {
        // Make sure the registering schema definition is valid
        if (!definition || !(definition instanceof Types.SchemaDefinition))
            throw new TypeError("Registering schema definition must be of type 'SchemaDefinition'");
        
        // Source name from schema definition if config is an object
        name = (typeof name === "string" ? name : (definition?.name ?? "")).replace(/\s+/g, "");
        
        // Prevent registering a schema definition under a name that already exists
        if (Schemas.#definitions.has(name) && Schemas.#definitions.get(name) !== definition)
            throw new TypeError(`Schema definition '${name}' already declared with id '${Schemas.#definitions.get(name).id}'`);
        // Prevent registering an existing schema definition under a different name
        else if (Schemas.declared(definition) && Schemas.#definitions.get(name) !== definition)
            throw new TypeError(`Schema definition '${definition.id}' already declared with name '${Schemas.#idsToNames.get(definition.id)}'`);
        // All good, register the schema definition
        else if (!Schemas.#definitions.has(name)) {
            Schemas.#definitions.set(name, definition);
            Schemas.#idsToNames.set(definition.id, name);
        }
        
        // Always return self for chaining
        return Schemas;
    }
    
    /**
     * Get registration status of specific schema definition, or get all registered schema definitions
     * @param {SCIMMY.Types.SchemaDefinition|String} [definition] - the schema definition or name to query registration status for
     * @returns {SCIMMY.Types.SchemaDefinition[]|SCIMMY.Types.SchemaDefinition|Boolean}
     * *   Array containing declared schema definitions for exposure via Schemas HTTP endpoint, if no arguments are supplied.
     * *   The registered schema definition with matching name or ID, or undefined, if a string argument is supplied.
     * *   The registration status of the specified schema definition, if a class extending `SCIMMY.Types.SchemaDefinition` was supplied.
     */
    static declared(definition) {
        // If no definition specified, return declared schema definitions
        if (!definition) {
            // Check for any schema definition extensions
            let extensions = [
                ...new Set([...Schemas.#definitions.values()].map(function find(d) {
                    let extensions = d.attributes.filter(a => a instanceof Types.SchemaDefinition);
                    return [...extensions, ...extensions.map(find)];
                })
                .flat(Infinity).map(e => Object.getPrototypeOf(e)))
            ];
            
            return [...new Set([...Schemas.#definitions.values(), ...extensions])];
        }
        // If definition is a string, find and return the matching schema definition
        else if (typeof definition === "string")
            // Try definition as declaration name, then try definition as declaration id or declared instance name
            return Schemas.#definitions.get(definition) ?? Schemas.declared().find((d) => [d?.id, d?.name].includes(definition));
        // If the definition is an instance of SchemaDefinition, see if it is already declared
        else if (definition instanceof Types.SchemaDefinition)
            return Schemas.declared().some((d) => d === definition);
        // Otherwise, the schema definition isn't declared...
        else return false;
    }
}