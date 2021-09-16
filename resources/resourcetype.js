import {Resource, Error as SCIMError} from "../types.js";
import {ListResponse} from "../messages.js";
import {ResourceType as ResourceTypeSchema} from "../schemas.js";
import Resources from "../resources.js";

/**
 * SCIM ResourceType Resource
 * @extends {Resource}
 */
export class ResourceType extends Resource {
    /** @implements {Resource~endpoint} */
    static get endpoint() {
        return "/ResourceTypes";
    }
    
    /** @implements {Resource~#basepath} */
    static #basepath;
    /** @implements {Resource~basepath} */
    static basepath(path) {
        if (path === undefined) return ResourceType.#basepath;
        else if (ResourceType.#basepath === undefined)
            ResourceType.#basepath = (path.endsWith(ResourceType.endpoint) ? path : `${path}${ResourceType.endpoint}`);
        
        return ResourceType;
    }
    
    /**
     * @override {Resource~extend}
     * @throws {TypeError} SCIM 'ResourceType' resource does not support extension
     */
    static extend() {
        throw new TypeError("SCIM 'ResourceType' resource does not support extension");
    }
    
    /**
     * Instantiate a new SCIM ResourceType resource and parse any supplied parameters
     * @implements {Resource#constructor}
     */
    constructor(params, ...rest) {
        // Bail out if a resource is requested by filter
        if (!!(typeof params === "string" ? rest[0] ?? {} : params ?? {}).filter)
            throw new SCIMError(403, null, "ResourceType does not support retrieval by filter");
        
        super(params, ...rest);
    }
    
    /** @implements {Resource#read} */
    async read() {
        if (!this.id) {
            return new ListResponse(Object.entries(Resources.registered())
                .map(([,R]) => new ResourceTypeSchema(R.describe(), ResourceType.basepath())));
        } else {
            try {
                return new ResourceTypeSchema(Resources.registered()[this.id].describe(), ResourceType.basepath());
            } catch {
                throw new SCIMError(404, null, `ResourceType ${this.id} not found`);
            }
        }
    }
}