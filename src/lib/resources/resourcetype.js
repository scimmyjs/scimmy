import Types from "../types.js";
import Messages from "../messages.js";
import Schemas from "../schemas.js";
import Resources from "../resources.js";

/**
 * SCIM ResourceType Resource
 * @alias SCIMMY.Resources.ResourceType
 */
export class ResourceType extends Types.Resource {
    /**
     * @static
     * @alias endpoint
     * @memberOf SCIMMY.Resources.ResourceType
     * @implements {SCIMMY.Types.Resource.endpoint}
     */
    static get endpoint() {
        return "/ResourceTypes";
    }
    
    /** @private */
    static #basepath;
    /**
     * @static
     * @alias basepath
     * @memberOf SCIMMY.Resources.ResourceType
     * @implements {SCIMMY.Types.Resource.basepath}
     */
    static basepath(path) {
        if (path === undefined) return ResourceType.#basepath;
        else if (ResourceType.#basepath === undefined)
            ResourceType.#basepath = (path.endsWith(ResourceType.endpoint) ? path : `${path}${ResourceType.endpoint}`);
        
        return ResourceType;
    }
    
    /**
     * @static
     * @alias extend
     * @memberOf SCIMMY.Resources.ResourceType
     * @implements {SCIMMY.Types.Resource.extend}
     * @throws {TypeError} SCIM 'ResourceType' resource does not support extension
     */
    static extend() {
        throw new TypeError("SCIM 'ResourceType' resource does not support extension");
    }
    
    /**
     * Instantiate a new SCIM ResourceType resource and parse any supplied parameters
     * @constructs SCIMMY.Resources.ResourceType
     * @extends SCIMMY.Types.Resource
     */
    constructor(params, ...rest) {
        // Bail out if a resource is requested by filter
        if (!!(typeof params === "string" ? rest[0] ?? {} : params ?? {}).filter)
            throw new Types.Error(403, null, "ResourceType does not support retrieval by filter");
        
        super(params, ...rest);
    }
    
    /**
     * @alias read
     * @memberOf SCIMMY.Resources.ResourceType
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