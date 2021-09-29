import {Attribute} from "./types/attribute.js";
import {SchemaDefinition} from "./types/definition.js";
import {Schema} from "./types/schema.js";
import {Resource} from "./types/resource.js";
import {Filter} from "./types/filter.js";
import {SCIMError as Error} from "./types/error.js";

/**
 * SCIMMY Types Container Class
 * @class SCIMMY.Types
 */
export default class Types {
    static Attribute = Attribute;
    static SchemaDefinition = SchemaDefinition;
    static Schema = Schema;
    static Resource = Resource;
    static Filter = Filter;
    static Error = Error;
};