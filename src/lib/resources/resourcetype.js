import Types from "../types.js";
import Messages from "../messages.js";
import Schemas from "../schemas.js";
import Resources from "../resources.js";

/**
 * SCIM ResourceType Resource
 * @alias SCIMMY.Resources.ResourceType
 * @summary
 * *   Formats SCIM Resource Type implementations declared in `{@link SCIMMY.Resources}` for transmission/consumption according to the ResourceType schema set out in [RFC7643§6](https://datatracker.ietf.org/doc/html/rfc7643#section-6).
 */
export class ResourceType extends Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/ResourceTypes";
    }
    
    /** @private */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return ResourceType.#basepath;
        else if (ResourceType.#basepath === undefined)
            ResourceType.#basepath = (path.endsWith(ResourceType.endpoint) ? path : `${path}${ResourceType.endpoint}`);
        
        return ResourceType;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.extend}
     * @throws {TypeError} SCIM 'ResourceType' resource does not support extension
     */
    static extend() {
        throw new TypeError("SCIM 'ResourceType' resource does not support extension");
    }
    
    /**
     * Instantiate a new SCIM ResourceType resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(id, config) {
        // Bail out if a resource is requested by filter
        if (!!((typeof id === "string" ? config : id) ?? {})?.filter)
            throw new Types.Error(403, null, "ResourceType does not support retrieval by filter");
        
        super(id, config);
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Schemas.ResourceType}
     */
    async read() {
        if (!this.id) {
            return new Messages.ListResponse(Object.entries(Resources.declared())
                .map(([,R]) => new Schemas.ResourceType(R.describe(), ResourceType.basepath())));
        } else {
            try {
                return new Schemas.ResourceType(Resources.declared(this.id).describe(), ResourceType.basepath());
            } catch {
                throw new Types.Error(404, null, `ResourceType ${this.id} not found`);
            }
        }
    }
}