import {Resource, Error as SCIMError} from "../types.js";
import {ServiceProviderConfig as SPConfigSchema} from "../schemas.js";
import {default as SPConfig} from "../config.js";

/**
 * SCIM ServiceProviderConfig Resource
 * @extends {Resource}
 */
export class ServiceProviderConfig extends Resource {
    /** @implements {Resource~endpoint} */
    static get endpoint() {
        return "/ServiceProviderConfig";
    }
    
    /** @implements {Resource~#basepath} */
    static #basepath;
    /** @implements {Resource~basepath} */
    static basepath(path) {
        if (path === undefined) return ServiceProviderConfig.#basepath;
        else if (ServiceProviderConfig.#basepath === undefined)
            ServiceProviderConfig.#basepath = (path.endsWith(ServiceProviderConfig.endpoint) ? path : `${path}${ServiceProviderConfig.endpoint}`);
        
        return ServiceProviderConfig;
    }
    
    /**
     * @override {Resource~extend}
     * @throws {TypeError} SCIM 'ServiceProviderConfig' resource does not support extension
     */
    static extend() {
        throw new TypeError("SCIM 'ServiceProviderConfig' resource does not support extension");
    }
    
    /**
     * Instantiate a new SCIM ServiceProviderConfig resource and parse any supplied parameters
     * @implements {Resource#constructor}
     */
    constructor(params, ...rest) {
        // Bail out if a resource is requested with filter or attribute properties
        if (!!Object.keys(typeof params === "string" ? rest[0] ?? {} : params ?? {}).length)
            throw new SCIMError(403, null, "ServiceProviderConfig does not support retrieval by filter");
        
        super(params, ...rest);
    }
    
    /** @implements {Resource#read} */
    async read() {
        return new SPConfigSchema(SPConfig.get(), ServiceProviderConfig.basepath());
    }
}