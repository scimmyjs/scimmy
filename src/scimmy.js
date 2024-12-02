import Types from "./lib/types.js";
import Messages from "./lib/messages.js";
import Schemas from "./lib/schemas.js";
import Resources from "./lib/resources.js";
import Config from "./lib/config.js";

// Export classes for direct consumption
export {Config, Types, Messages, Schemas, Resources};

/**
 * SCIMMY Container Class
 * @namespace SCIMMY
 * @description
 * SCIMMY exports a singleton class which provides the following interfaces:
 * *    `{@link SCIMMY.Config}`
 *      *   SCIM Service Provider Configuration container store.
 * *    `{@link SCIMMY.Types}`
 *      *   SCIMMY classes for implementing schemas and resource types.
 * *    `{@link SCIMMY.Messages}`
 *      *   Implementations of non-resource SCIM "message" schemas, such as ListResponse and PatchOp.
 * *    `{@link SCIMMY.Schemas}`
 *      *   Container store for declaring and retrieving schemas implemented by a service provider.
 *      *   Also provides access to bundled schema implementations of [SCIM Core Resource Schemas](https://datatracker.ietf.org/doc/html/rfc7643#section-4).
 * *    `{@link SCIMMY.Resources}`
 *      *   Container store for declaring and retrieving resource types implemented by a service provider.
 *      *   Also provides access to bundled resource type implementations of [SCIM Core Resource Types](https://datatracker.ietf.org/doc/html/rfc7643#section-4).
 */
export default class SCIMMY {
    static Config = Config;
    static Types = Types;
    static Messages = Messages;
    static Schemas = Schemas;
    static Resources = Resources;
}