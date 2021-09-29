import Types from "../types.js";
import Schemas from "../schemas.js";
import Config from "../config.js";

/**
 * SCIM ServiceProviderConfig Resource
 * @class SCIMMY.Resources.ServiceProviderConfig
 * @extends {SCIMMY.Types.Resource}
 */
export class ServiceProviderConfig extends Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/ServiceProviderConfig";
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.#basepath}
     * @private
     */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return ServiceProviderConfig.#basepath;
        else if (ServiceProviderConfig.#basepath === undefined)
            ServiceProviderConfig.#basepath = (path.endsWith(ServiceProviderConfig.endpoint) ? path : `${path}${ServiceProviderConfig.endpoint}`);
        
        return ServiceProviderConfig;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.extend}
     * @throws {TypeError} SCIM 'ServiceProviderConfig' resource does not support extension
     */
    static extend() {
        throw new TypeError("SCIM 'ServiceProviderConfig' resource does not support extension");
    }
    
    /**
     * Instantiate a new SCIM ServiceProviderConfig resource and parse any supplied parameters
     * @implements {SCIMMY.Types.Resource#constructor}
     */
    constructor(params, ...rest) {
        // Bail out if a resource is requested with filter or attribute properties
        if (!!Object.keys(typeof params === "string" ? rest[0] ?? {} : params ?? {}).length)
            throw new Types.Error(403, null, "ServiceProviderConfig does not support retrieval by filter");
        
        super(params, ...rest);
    }
    
    /** @implements {SCIMMY.Types.Resource#read} */
    async read() {
        return new Schemas.ServiceProviderConfig(Config.get(), ServiceProviderConfig.basepath());
    }
}