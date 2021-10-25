import {Attribute} from "./types/attribute.js";
import {SchemaDefinition} from "./types/definition.js";
import {Schema} from "./types/schema.js";
import {Resource} from "./types/resource.js";
import {Filter} from "./types/filter.js";
import {SCIMError as Error} from "./types/error.js";

/**
 * SCIMMY Types Container Class
 * @namespace SCIMMY.Types
 * @description
 * SCIMMY provides a singleton class, `SCIMMY.Types`, that exposes the building blocks used to create SCIM schemas and resource types, and handle SCIM schema and protocol errors.
 * These can be used to construct custom resource types and handle errors encountered when invoking supplied read/write/delete handlers of built-in resources.
 */
export default class Types {
    static Attribute = Attribute;
    static SchemaDefinition = SchemaDefinition;
    static Schema = Schema;
    static Resource = Resource;
    static Filter = Filter;
    static Error = Error;
};