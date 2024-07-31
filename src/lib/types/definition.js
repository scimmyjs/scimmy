import {Attribute} from "./attribute.js";
import {Filter} from "./filter.js";

// Deeply inspect a filter object to see if it represents attributes to be excluded from a coerced value
const isExcludedAttributesFilter = (v) => Array.isArray(v) ? v[0] === "np" : Object.values(v).every(isExcludedAttributesFilter);

/**
 * SCIM Schema Definition Type
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
        if (name.toLowerCase().startsWith("urn:")) {
            // Handle namespaced attributes by looking for a matching extension
            const extension = (this.attributes.find(a => a instanceof SchemaDefinition && name.toLowerCase().startsWith(a.id.toLowerCase()))
                ?? (name.toLowerCase().startsWith(`${this.id.toLowerCase()}:`) || name.toLowerCase() === this.id.toLowerCase() ? this : false));
            // Get the actual attribute name minus extension ID
            const attribute = (extension ? name.substring(extension.id.length+1) : "");
            
            // Bail out if no schema extension found with matching ID 
            if (!extension)
                throw new TypeError(`Schema definition '${this.id}' does not declare schema extension for namespaced target '${name}'`);
            
            // If the actual name is empty, return the extension, otherwise search the extension
            return (!attribute.length ? extension : extension.attribute(attribute));
        } else {
            // Break name into path parts in case of search for sub-attributes
            const path = name.split(".");
            const spent = [path.shift()];
            // Find the first attribute in the path
            let [target] = spent,
                attribute = this.attributes.find(a => a instanceof Attribute && a.name.toLowerCase() === target.toLowerCase());
            
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
                attribute = attribute.subAttributes.find(a => a instanceof Attribute && a.name.toLowerCase() === target.toLowerCase());
                
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
     * @param {SCIMMY.Types.SchemaDefinition|Array<SCIMMY.Types.Attribute>} extension - the schema extension or collection of attributes to register
     * @param {Boolean} [required=false] - if the extension is a schema, whether the extension is required
     * @returns {SCIMMY.Types.SchemaDefinition} this schema definition instance for chaining
     */
    extend(extension = [], required) {
        const attribs = this.attributes.map(a => a instanceof SchemaDefinition ? Object.getPrototypeOf(a) : a);
        const extensions = (Array.isArray(extension) ? extension : [extension]);
        
        // If the extension is a schema definition, add it to the schema definition instance
        if (extension instanceof SchemaDefinition) {
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
            const surplusSchemas = extension.attributes.filter(e => e instanceof SchemaDefinition);
            for (let definition of surplusSchemas) this.extend(definition);
        }
        // If every extension is an attribute instance, add them to the schema definition
        else if (extensions.every(e => e instanceof Attribute)) {
            // Go through all extension attributes to register
            for (let attribute of extensions) {
                // Make sure the attribute isn't already included
                if (!attribs.includes(attribute)) {
                    // Make sure attribute name is unique
                    if (this.attributes.some(a => a.name === attribute.name))
                        throw new TypeError(`Schema definition '${this.id}' already declares attribute '${attribute.name}'`);
                    
                    this.attributes.push(attribute);
                }
            }
        }
        // If something other than a schema definition or attribute is supplied, bail out!
        else throw new TypeError("Expected 'extension' to be a SchemaDefinition or collection of Attribute instances");
        
        return this;
    }
    
    /**
     * Remove an attribute, extension schema, or subAttribute from a schema or attribute definition
     * @param {...String} target - the name, or names, of attributes to remove from the schema definition
     * @param {...SCIMMY.Types.Attribute} target - the attribute instance, or instances, to remove from the schema definition
     * @param {...SCIMMY.Types.SchemaDefinition} target - the extension schema, or schemas, to remove from the schema definition
     * @returns {SCIMMY.Types.SchemaDefinition} this schema definition instance for chaining
     */
    truncate(...target) {
        const targets = target.flat();
        
        for (let t of targets) {
            if (this.attributes.includes(t)) {
                // Remove a found attribute from the schema definition
                const index = this.attributes.indexOf(t);
                if (index >= 0) this.attributes.splice(index, 1);
            } else if (typeof t === "string") {
                // Look for the target attribute to remove, which throws a TypeError if not found
                const target = this.attribute(t);
                
                // Either try truncate again with the target attribute
                if (!t.includes(".")) this.truncate(target);
                // Or find the containing attribute and truncate it from there
                else this.attribute(t.split(".").slice(0, -1).join(".")).truncate(target);
            } else if (t instanceof SchemaDefinition) {
                // Look for the target schema extension to remove, which throws a TypeError if not found
                const target = this.attribute(t.id);
                // Remove a found schema extension from the schema definition
                const index = this.attributes.indexOf(target);
                if (index >= 0) this.attributes.splice(index, 1);
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
        if (data === undefined || Array.isArray(data) || Object(data) !== data)
            throw new TypeError("Expected 'data' parameter to be an object in SchemaDefinition instance");
        
        // Get the filter and coercion target ready
        const filter = (filters ?? []).slice(0).shift();
        const target = {};
        // Compile a list of schema IDs to include in the resource
        const schemas = [...new Set([
            this.id,
            ...(this.attributes.filter(a => a instanceof SchemaDefinition).map(s => s.id)
                .filter(id => !!data[id] || Object.keys(data).some(d => d.startsWith(`${id}:`)))),
            ...(Array.isArray(data.schemas) ? data.schemas : [])
        ])];
        // Add schema IDs, and schema's name as resource type to meta attribute
        const source = {
            // Cast all key names to lower case to eliminate case sensitivity....
            ...(Object.keys(data).reduce((res, key) => Object.assign(res, {[key.toLowerCase()]: data[key]}), {})),
            schemas, meta: {
                ...(data?.meta ?? {}), resourceType: this.name,
                ...(typeof basepath === "string" ? {location: `${basepath}${!!data.id ? `/${data.id}` : ""}`} : {})
            }
        };
        
        // Go through all attributes and coerce them
        for (let attribute of this.attributes) {
            if (attribute instanceof Attribute) {
                // Evaluate the coerced value
                const {name} = attribute;
                const value = attribute.coerce(source[name.toLowerCase()], direction);
                
                // If it's defined, add it to the target
                if (value !== undefined) target[name] = value;
            } else if (attribute instanceof SchemaDefinition) {
                const {id: name, required} = attribute;
                // Get any values from the source that begin with the extension ID
                const namespacedValues = Object.keys(source).filter(k => k.startsWith(`${name.toLowerCase()}:`))
                    // Get the actual attribute name and value
                    .map(k => [k.replace(`${name.toLowerCase()}:`, ""), source[k]])
                    .reduce((res, [name, value]) => {
                        // Get attribute path parts and actual value
                        const parts = name.toLowerCase().split(".");
                        const target = {[parts.pop()]: value};
                        let parent = res;
                        
                        // Traverse as deep as necessary
                        while (parts.length > 0) {
                            const path = parts.shift();
                            parent = (parent[path] = parent[path] ?? {});
                        }
                        
                        // Assign and return
                        Object.assign(parent, target);
                        return res;
                    }, {});
                // Mix the namespaced attribute values in with the extension value
                const mixedSource = [source[name.toLowerCase()] ?? {}, namespacedValues ?? {}].reduce(function merge(t, s) {
                    // Cast all key names to lower case to eliminate case sensitivity....
                    t = (Object.keys(t).reduce((res, key) => Object.assign(res, {[key.toLowerCase()]: t[key]}), {}));
                    
                    // Merge all properties from s into t, joining arrays and objects
                    for (let skey of Object.keys(s)) {
                        const tkey = skey.toLowerCase();
                        
                        // If source is an array...
                        if (Array.isArray(s[skey])) {
                            // ...and target is an array, merge them...
                            if (Array.isArray(t[tkey])) t[tkey].push(...s[skey]);
                            // ...otherwise, make target an array
                            else t[tkey] = [...s[skey]];
                        }
                        // If source is a primitive value, copy it
                        else if (s[skey] !== Object(s[skey])) t[tkey] = s[skey];
                        // Finally, if source is neither an array nor primitive, merge it
                        else t[tkey] = merge(t[tkey] ?? {}, s[skey]);
                    }
                    
                    return t;
                }, {});
                
                // Attempt to coerce the schema extension
                if (!!required && !Object.keys(mixedSource).length) {
                    throw new TypeError(`Missing values for required schema extension '${name}'`);
                } else if (required || Object.keys(mixedSource).length) {
                    try {
                        // Coerce the mixed value, using only namespaced attributes for this extension
                        target[name] = attribute.coerce(mixedSource, direction, basepath, [Object.keys(filter ?? {})
                            .filter(k => k.startsWith(`${name}:`))
                            .reduce((res, key) => Object.assign(res, {[key.replace(`${name}:`, "")]: filter[key]}), {})
                        ]);
                    } catch (ex) {
                        // Rethrow exception with added context
                        ex.message += ` in schema extension '${name}'`;
                        throw ex;
                    }
                }
            }
        }
        
        return SchemaDefinition.#filter(this, filter && {...filter}, target);
    }
    
    /**
     * Filter out desired or undesired attributes from a coerced schema value
     * @param {SCIMMY.Types.SchemaDefinition} definition - the schema definition requesting the filtering
     * @param {Object} [filter] - the filter to apply to the coerced value
     * @param {Object|Object[]} [data={}] - the data to filter attributes from
     * @param {String} [prefix=""] - prefix to use when filtering on complex value subAttributes
     * @returns {Object} the coerced value with desired or undesired attributes filtered out
     * @private
     */
    static #filter(definition, filter, data = {}, prefix = "") {
        // If there's no filter, just return the data
        if (filter === undefined || !Object.keys(filter).length)
            return data;
        // If the data is a set, only get values that match the filter
        else if (Array.isArray(data))
            return data.map(data => SchemaDefinition.#filter(definition, {...filter}, data, prefix)).filter(v => Object.keys(v).length);
        // Otherwise, filter the data!
        else {
            // Prepare resultant value storage
            const target = {};
            const inclusions = [];
            const exclusions = [];
            
            for (let key in filter) try {
                // Find the attribute or extension definition using the filter key
                const attribute = definition.attribute(prefix ? `${prefix}.${key}` : key);
                
                // Only be concerned with filter expressions for attributes or extensions directly for now
                if (Array.isArray(filter[key]) && (attribute instanceof SchemaDefinition || !key.startsWith("urn:"))) {
                    const name = (attribute instanceof SchemaDefinition ? attribute.id : attribute.name);
                    
                    // Mark the positively filtered property as included in the result
                    if (filter[key][0] === "pr")
                        inclusions.push(name);
                    // Mark the negatively filtered property as excluded from the result
                    else if (filter[key][0] === "np")
                        exclusions.push(name);
                }
            } catch {
                // If we've reached here, the filter refers to an unknown attribute and should be ignored
            }
            
            // If there were no explicit inclusions, and all filter expressions were negative...
            if (!inclusions.length && isExcludedAttributesFilter(filter)) {
                // ...go through all subAttributes, or extension attributes...
                for (let attribute of (prefix ? definition.attribute(prefix).subAttributes : definition.attributes)) {
                    // ...and assume they should be included, if they weren't explicitly excluded
                    if (attribute instanceof Attribute && !exclusions.includes(attribute.name)) inclusions.push(attribute.name);
                }
            }
            
            // Go through every value in the data and filter it
            for (let key in data) {
                // Get the matching attribute or extension definition for the key
                const attribute = definition.attribute(prefix ? `${prefix}.${key}` : key) ?? {};
                
                if (attribute instanceof SchemaDefinition) {
                    // If there is data in a namespaced key and no namespace filter, or there's an explicit inclusion filter...
                    if ((Object.keys(data[key]).length && !Array.isArray(filter[key])) || (key in filter && !exclusions.includes(key)))
                        // ...include the extension data
                        target[key] = data[key];
                } else {
                    // Get some relevant config values from the attribute
                    const {name, type, config: {returned, multiValued} = {}} = attribute;
                    
                    // If the attribute is always returned, add it to the result
                    if (returned === "always") target[key] = data[key];
                    // Otherwise, if the attribute was requested and ~can~ be returned, process it
                    else if (![false, "never"].includes(returned)) {
                        // If there's a filter for a complex attribute, evaluate it
                        if (key in filter && !Array.isArray(filter[key]) && type === "complex") {
                            const value = SchemaDefinition.#filter(definition, filter[key], data[key], key);
                            
                            // Only set the value if it isn't empty
                            if ((!multiValued && value !== undefined) || (Array.isArray(value) && value.length))
                                target[key] = value;
                        }
                        // Otherwise, if there was a simple presence filter for the attribute, assign it
                        else if (inclusions.includes(name) && data[key] !== undefined) {
                            target[key] = data[key];
                        }
                    }
                }
            }
            
            return target;
        }
    }
}