import {Attribute} from "./attribute.js";
import {Filter} from "./filter.js";

/**
 * SCIM Schema Definition
 * @alias SCIMMY.Types.SchemaDefinition
 * @summary
 * *   Defines an underlying SCIM schema definition, containing the schema's URN namespace, friendly name, description, and collection of attributes that make up the schema.
 * *   Provides a way to ensure all properties of a resource conform to their attribute definitions, as well as enabling JSON expression of schemas for consumption by other SCIM clients or service providers.
 */
export class SchemaDefinition {
    /**
     * Constructs an instance of a full SCIM schema definition
     * @param {String} name - friendly name of the SCIM schema
     * @param {String} id - URN namespace of the SCIM schema
     * @param {String} [description=""] - a human-readable description of the schema
     * @param {SCIMMY.Types.Attribute[]} [attributes=[]] - attributes that make up the schema
     * @property {String} name - friendly name of the SCIM schema
     * @property {String} id - URN namespace of the SCIM schema
     * @property {String} description - human-readable description of the schema
     * @property {SCIMMY.Types.Attribute[]} attributes - attributes that make up the schema
     */
    constructor(name, id, description = "", attributes = []) {
        // Make sure name, ID, and description values are supplied
        for (let [param, value] of [["name", name], ["id", id], ["description", description]]) {
            // Bail out if parameter value is empty
            if (value === undefined)
                throw new TypeError(`Required parameter '${param}' missing from SchemaDefinition instantiation`);
            if (typeof value !== "string" || (param !== "description" && !value.length))
                throw new TypeError(`Expected '${param}' to be a ${param !== "description" ? "non-empty string" : "string"} in SchemaDefinition instantiation`);
        }
        
        // Make sure ID is a valid SCIM schema URN namespace
        if (!id.startsWith("urn:ietf:params:scim:schemas:"))
            throw new TypeError(`Invalid SCIM schema URN namespace '${id}' in SchemaDefinition instantiation`);
        
        // Store the schema name, ID, and description
        this.name = name;
        this.id = id;
        this.description = description;
        
        // Add common attributes used by all schemas, then add the schema-specific attributes
        this.attributes = [
            new Attribute("reference", "schemas", {shadow: true, multiValued: true, referenceTypes: ["uri"]}),
            new Attribute("string", "id", {shadow: true, direction: "out", returned: "always", required: true, mutable: false, caseExact: true, uniqueness: "global"}),
            new Attribute("string", "externalId", {shadow: true, direction: "in", caseExact: true}),
            new Attribute("complex", "meta", {shadow: true, required: true, mutable: false}, [
                new Attribute("string", "resourceType", {required: true, mutable: false, caseExact: true}),
                new Attribute("dateTime", "created", {direction: "out", mutable: false}),
                new Attribute("dateTime", "lastModified", {direction: "out", mutable: false}),
                new Attribute("string", "location", {direction: "out", mutable: false}),
                new Attribute("string", "version", {direction: "out", mutable: false})
            ]),
            // Only include valid Attribute instances
            ...attributes.filter(attr => attr instanceof Attribute)
        ];
    }
    
    /**
     * Get the SCIM schema definition for consumption by clients
     * @param {String} [basepath=""] - the base path for the schema's meta.location property
     * @returns {Object} the schema definition for consumption by clients
     */
    describe(basepath = "") {
        return {
            schemas: ["urn:ietf:params:scim:schemas:core:2.0:Schema"],
            id: this.id, name: this.name, description: this.description,
            attributes: this.attributes.filter(a => (a instanceof Attribute && !a.config.shadow)),
            meta: {resourceType: "Schema", location: `${basepath}/${this.id}`}
        };
    }
    
    /**
     * Find an attribute or extension instance belonging to the schema definition by its name
     * @param {String} name - the name of the attribute to look for (namespaced or direct)
     * @returns {SCIMMY.Types.Attribute|SCIMMY.Types.SchemaDefinition} the Attribute or SchemaDefinition instance with matching name
     */
    attribute(name) {
        if (name.startsWith("urn:")) {
            // Handle namespaced attributes by looking for a matching extension
            let extension = (name.toLowerCase().startsWith(this.id.toLowerCase()) ? this : this.attributes
                    .find(a => a instanceof SchemaDefinition && name.toLowerCase().startsWith(a.id.toLowerCase()))),
                // Get the actual attribute name minus extension ID
                attribute = name.toLowerCase().replace(extension.id.toLowerCase(), "").slice(1);
            
            // If the actual name is empty, return the extension, otherwise search the extension
            return (!attribute.length ? extension : extension.attribute(attribute));
        } else {
            // Break name into path parts in case of search for sub-attributes
            let path = name.toLowerCase().split("."),
                // Find the first attribute in the path
                target = path.shift(),
                attribute = this.attributes.find(a => a instanceof Attribute && a.name.toLowerCase() === target),
                spent = [target];
            
            // If nothing was found, the attribute isn't declared by the schema definition
            if (attribute === undefined)
                throw new TypeError(`Schema definition '${this.id}' does not declare attribute '${target}'`);
            
            // Evaluate the rest of the path
            while (path.length > 0) {
                // If the attribute isn't complex, it can't declare sub-attributes
                if (attribute.type !== "complex")
                    throw new TypeError(`Attribute '${spent.join(".")}' of schema '${this.id}' is not of type 'complex' and does not define any subAttributes`);
                
                // Find the next attribute in the path
                target = path.shift();
                attribute = attribute.subAttributes.find(a => a instanceof Attribute && a.name.toLowerCase() === target);
                
                // If nothing found, the attribute doesn't declare the target as a sub-attribute
                if (attribute === undefined)
                    throw new TypeError(`Attribute '${spent.join(".")}' of schema '${this.id}' does not declare subAttribute '${target}'`);
                
                // Add the found attribute to the spent path
                spent.push(target);
            }
            
            return attribute;
        }
    }
    
    /**
     * Extend a schema definition instance by mixing in other schemas or attributes
     * @param {Array<SCIMMY.Types.SchemaDefinition|SCIMMY.Types.Attribute>} extensions - the schema extensions or collection of attributes to register
     * @param {Boolean} [required=false] - if the extension is a schema, whether or not the extension is required
     * @returns {SCIMMY.Types.SchemaDefinition} this schema definition instance for chaining
     */
    extend(extensions = [], required) {
        let attribs = this.attributes.map(a => a instanceof SchemaDefinition ? Object.getPrototypeOf(a) : a);
        
        // Go through all extensions to register
        for (let extension of (Array.isArray(extensions) ? extensions : [extensions])) {
            // If the extension is an attribute, add it to the schema definition instance
            if (extension instanceof Attribute) {
                // Make sure the attribute isn't already included
                if (!attribs.includes(extension)) {
                    // Make sure attribute name is unique
                    if (this.attributes.some(a => a.name === extension.name))
                        throw new TypeError(`Schema definition '${this.id}' already declares attribute '${extension.name}'`);
                    
                    this.attributes.push(extension);
                }
            }
            // If the extension is a schema definition, add it to the schema definition instance
            else if (extension instanceof SchemaDefinition) {
                // Make sure the extension isn't already included
                if (!attribs.includes(extension)) {
                    // Make sure extension name is unique
                    if (attribs.filter(a => a instanceof SchemaDefinition).some(d => d.id === extension.id))
                        throw new TypeError(`Schema definition '${this.id}' already declares extension '${extension.id}'`);
                    
                    // Proxy the schema definition for use in this schema definition
                    this.attributes.push(Object.create(extension, {
                        // Store whether the extension is required
                        required: {value: required ?? extension.required ?? false},
                        // When queried, only return attributes that directly belong to the schema definition
                        attributes: {get: () => extension.attributes.filter(a => a instanceof Attribute && !a?.config?.shadow)}
                    }));
                }
                
                // Go through the schema extension definition and directly register any nested schema definitions
                let surplusSchemas = extension.attributes.filter(e => e instanceof SchemaDefinition);
                for (let definition of surplusSchemas) this.extend(definition);
            }
            // If something other than a schema definition or attribute is supplied, bail out!
            else throw new TypeError("Expected 'extensions' to be a collection of SchemaDefinition or Attribute instances");
        }
        
        return this;
    }
    
    /**
     * Remove an attribute or subAttribute from a schema or attribute definition
     * @param {String|String[]|SCIMMY.Types.Attribute|SCIMMY.Types.Attribute[]} attributes - the child attributes to remove from the schema or attribute definition
     * @returns {SCIMMY.Types.SchemaDefinition} this schema definition instance for chaining
     */
    truncate(attributes = []) {
        for (let attrib of (Array.isArray(attributes) ? attributes : [attributes])) {
            if (this.attributes.includes(attrib)) {
                // Remove a found attribute from the schema definition
                let index = this.attributes.indexOf(attrib);
                if (index >= 0) this.attributes.splice(index, 1);
            } else if (typeof attrib === "string") {
                // Look for the target attribute to remove, which throws a TypeError if not found
                let target = this.attribute(attrib);
                
                // Either try truncate again with the target attribute
                if (!attrib.includes(".")) this.truncate(target);
                // Or find the containing attribute and truncate it from there
                else this.attribute(attrib.split(".").slice(0, -1).join(".")).truncate(target);
            }
        }
        
        return this;
    }
    
    /**
     * Coerce a given value by making sure it conforms to all schema attributes' characteristics
     * @param {Object} data - value to coerce and confirm conformity of properties to schema attributes' characteristics
     * @param {String} [direction="both"] - whether to check for inbound, outbound, or bidirectional attributes
     * @param {String} [basepath] - the URI representing the resource type's location
     * @param {SCIMMY.Types.Filter} [filters] - the attribute filters to apply to the coerced value
     * @returns {Object} the coerced value, conforming to all schema attributes' characteristics
     */
    coerce(data, direction = "both", basepath, filters) {
        // Make sure there is data to coerce...
        if (data === undefined) throw new Error("No data to coerce");
        
        let filter = (filters ?? []).slice(0).shift(),
            target = {},
            // Compile a list of schema IDs to include in the resource
            schemas = [...new Set([
                this.id,
                ...(this.attributes.filter(a => a instanceof SchemaDefinition)
                    .map(s => s.id).filter(id => !!data[id])),
                ...(Array.isArray(data.schemas) ? data.schemas : [])
            ])],
            // Add schema IDs, and schema's name as resource type to meta attribute
            source = {
                // Cast all key names to lower case to eliminate case sensitivity....
                ...(Object.keys(data).reduce((res, key) => (((res[key.toLowerCase()] = data[key]) || true) && res), {})),
                schemas: schemas, meta: {
                    ...(data?.meta ?? {}), resourceType: this.name,
                    ...(typeof basepath === "string" ? {location: `${basepath}${!!data.id ? `/${data.id}` : ""}`} : {})
                }
            };
        
        // Go through all attributes and coerce them
        for (let attribute of this.attributes) {
            if (attribute instanceof Attribute) {
                let {name} = attribute,
                    // Evaluate the coerced value
                    value = attribute.coerce(source[name.toLowerCase()], direction);
                
                // If it's defined, add it to the target
                if (value !== undefined) target[name] = value;
            } else if (attribute instanceof SchemaDefinition) {
                let {id: name, required} = attribute,
                    // Get any values from the source that begin with the extension ID
                    namespacedValues = Object.keys(source).filter(k => k.startsWith(`${name.toLowerCase()}:`))
                        // Get the actual attribute name and value
                        .map(k => [k.replace(`${name.toLowerCase()}:`, ""), source[k]])
                        .reduce((res = {}, [name, value]) => {
                            // Get attribute path parts and actual value
                            let parts = name.toLowerCase().split("."),
                                parent = res,
                                target = {[parts.pop()]: value};
                            
                            // Traverse as deep as necessary
                            while (parts.length > 0) {
                                let path = parts.shift();
                                parent = (parent[path] = parent[path] ?? {});
                            }
                            
                            // Assign and return
                            Object.assign(parent, target);
                            return res;
                        }, undefined),
                    // Mix the namespaced attribute values in with the extension value
                    mixedSource = [source[name.toLowerCase()] ?? {}, namespacedValues ?? {}].reduce(function merge(t, s) {
                        // Cast all key names to lower case to eliminate case sensitivity....
                        t = (Object.keys(t).reduce((res, key) => (((res[key.toLowerCase()] = t[key]) || true) && res), {}));
                        
                        // Merge all properties from s into t, joining arrays and objects
                        for (let skey of Object.keys(s)) {
                            let tkey = skey.toLowerCase();
                            if (Array.isArray(t[tkey]) && Array.isArray(s[skey])) t[tkey].push(...s[skey]);
                            else if (s[skey] !== Object(s[skey])) t[tkey] = s[skey];
                            else t[tkey] = merge(t[tkey] ?? {}, s[skey]);
                        }
                        
                        return t;
                    }, {});
                
                // Attempt to coerce the schema extension
                if (!!required && !Object.keys(mixedSource).length) {
                    throw new TypeError(`Missing values for required schema extension '${name}'`);
                } else if (required || Object.keys(mixedSource).length) {
                    try {
                        // Coerce the mixed value
                        target[name] = attribute.coerce(mixedSource, direction, basepath, filter);
                    } catch (ex) {
                        // Rethrow exception with added context
                        ex.message += ` in schema extension '${name}'`;
                        throw ex;
                    }
                }
            }
        }
        
        return SchemaDefinition.#filter(target, {...filter}, this.attributes);
    }
    
    /**
     * Filter out desired or undesired attributes from a coerced schema value
     * @param {Object|Object[]} [data] - the data to filter attributes from
     * @param {Object} [filter] - the filter to apply to the coerced value
     * @param {SCIMMY.Types.Attribute[]} [attributes] - set of attributes to match against
     * @returns {Object} the coerced value with desired or undesired attributes filtered out
     * @private
     */
    static #filter(data = {}, filter, attributes) {
        // If there's no filter, just return the data
        if (filter === undefined) return data;
        // If the data is a set, only get values that match the filter
        else if (Array.isArray(data)) return new Filter([filter]).match(data);
        // Otherwise, filter the data!
        else {
            // Check for any negative filters
            for (let key in {...filter}) {
                // Find the attribute by lower case name
                let {name, config: {returned} = {}} = attributes.find(a => a.name.toLowerCase() === key.toLowerCase()) ?? {};
                
                if (returned !== "always" && Array.isArray(filter[key]) && filter[key][0] === "np") {
                    // Remove the property from the result, and remove the spent filter
                    delete data[name];
                    delete filter[key];
                }
            }
            
            // Check to see if there's any filters left
            if (!Object.keys(filter).length) return data;
            else {
                // Prepare resultant value storage
                let target = {}
                
                // Go through every value in the data and filter attributes
                for (let key in data) {
                    // TODO: namespaced attributes and extensions
                    // Get the matching attribute definition and some relevant config values
                    let attribute = attributes.find(a => a.name === key) ?? {},
                        {type, config: {returned, multiValued} = {}, subAttributes} = attribute;
                    
                    // If the attribute is always returned, add it to the result
                    if (returned === "always") target[key] = data[key];
                    // Otherwise, if the attribute ~can~ be returned, process it
                    else if (returned === true) {
                        // If the filter is simply based on presence, assign the result
                        if (Array.isArray(filter[key]) && filter[key][0] === "pr")
                            target[key] = data[key];
                        // Otherwise if the filter is defined and the attribute is complex, evaluate it
                        else if (key in filter && type === "complex") {
                            let value = SchemaDefinition.#filter(data[key], filter[key], multiValued ? [] : subAttributes);
                            
                            // Only set the value if it isn't empty
                            if ((!multiValued && value !== undefined) || (Array.isArray(value) && value.length))
                                target[key] = value;
                        }
                    }
                }
                
                return target;
            }
        }
    }
}