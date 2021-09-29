import Types from "../types.js";
import Messages from "../messages.js";
import Schemas from "../schemas.js";

/**
 * SCIM Schema Resource
 * @class SCIMMY.Resources.Schema
 * @extends {SCIMMY.Types.Resource}
 */
export class Schema extends Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/Schemas";
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.#basepath}
     * @private
     */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return Schema.#basepath;
        else if (Schema.#basepath === undefined)
            Schema.#basepath = (path.endsWith(Schema.endpoint) ? path : `${path}${Schema.endpoint}`);
        
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
     * @implements {SCIMMY.Types.Resource#constructor}
     */
    constructor(params, ...rest) {
        // Bail out if a resource is requested by filter
        if (!!(typeof params === "string" ? rest[0] ?? {} : params ?? {}).filter)
            throw new Types.Error(403, null, "Schema does not support retrieval by filter");
        
        super(params, ...rest);
    }
    
    /** @implements {SCIMMY.Types.Resource#read} */
    async read() {
        if (!this.id) {
            return new Messages.ListResponse(Object.entries(Schemas.declared())
                .map(([, S]) => S.describe(Schema.basepath())));
        } else {
            try {
                return Schemas.declared(this.id).describe(Schema.basepath());
            } catch (ex) {
                throw new Types.Error(404, null, `Schema ${this.id} not found`);
            }
        }
    }
}