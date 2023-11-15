import Types from "../types.js";
import Messages from "../messages.js";
import Schemas from "../schemas.js";

/**
 * SCIM Schema Resource
 * @alias SCIMMY.Resources.Schema
 * @summary
 * *   Formats SCIM schema definition implementations declared in `{@link SCIMMY.Schemas}` for transmission/consumption according to the Schema Definition schema set out in [RFC7643§7](https://datatracker.ietf.org/doc/html/rfc7643#section-7).
 */
export class Schema extends Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/Schemas";
    }
    
    /** @private */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return Schema.#basepath;
        else Schema.#basepath = (path.endsWith(Schema.endpoint) ? path : `${path}${Schema.endpoint}`);
        
        return Schema;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.extend}
     * @throws {TypeError} SCIM 'Schema' resource does not support extension
     */
    static extend() {
        throw new TypeError("SCIM 'Schema' resource does not support extension");
    }
    
    /**
     * Instantiate a new SCIM Schema resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(id, config) {
        // Bail out if a resource is requested by filter
        if (!!((typeof id === "string" ? config : id) ?? {})?.filter)
            throw new Types.Error(403, null, "Schema does not support retrieval by filter");
        
        super(id, config);
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Messages.ListResponse|Object}
     */
    async read() {
        if (!this.id) {
            return new Messages.ListResponse(Schemas.declared().map((S) => S.describe(Schema.basepath())));
        } else {
            try {
                return Schemas.declared(this.id).describe(Schema.basepath());
            } catch (ex) {
                throw new Types.Error(404, null, `Schema ${this.id} not found`);
            }
        }
    }
}