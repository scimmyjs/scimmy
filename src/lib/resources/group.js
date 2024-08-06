import Types from "../types.js";
import Messages from "../messages.js";
import Schemas from "../schemas.js";

/**
 * SCIM Group Resource
 * @alias SCIMMY.Resources.Group
 * @summary
 * *   Handles read/write/patch/dispose operations for SCIM Group resources with specified ingress/egress/degress methods.
 * *   Formats SCIM Group resources for transmission/consumption using the `{@link SCIMMY.Schemas.Group}` schema class.
 */
export class Group extends Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/Groups";
    }
    
    /** @private */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return Group.#basepath;
        else Group.#basepath = (path.endsWith(Group.endpoint) ? path : `${path}${Group.endpoint}`);
        
        return Group;
    }
    
    /** @implements {SCIMMY.Types.Resource.schema} */
    static get schema() {
        return Schemas.Group;
    }
    
    /** @private */
    static #ingress = () => {
        throw new Types.Error(501, null, "Method 'ingress' not implemented by resource 'Group'");
    };
    
    /** @implements {SCIMMY.Types.Resource.ingress} */
    static ingress(handler) {
        Group.#ingress = handler;
        return Group;
    }
    
    /** @private */
    static #egress = () => {
        throw new Types.Error(501, null, "Method 'egress' not implemented by resource 'Group'");
    };
    
    /** @implements {SCIMMY.Types.Resource.egress} */
    static egress(handler) {
        Group.#egress = handler;
        return Group;
    }
    
    /** @private */
    static #degress = () => {
        throw new Types.Error(501, null, "Method 'degress' not implemented by resource 'Group'");
    };
    
    /** @implements {SCIMMY.Types.Resource.degress} */
    static degress(handler) {
        Group.#degress = handler;
        return Group;
    }
    
    /**
     * Instantiate a new SCIM Group resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(...params) {
        super(...params);
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Schemas.Group}
     * @example
     * // Retrieve group with ID "1234"
     * await new SCIMMY.Resources.Group("1234").read();
     * @example
     * // Retrieve groups with a group name starting with "A"
     * await new SCIMMY.Resources.Group({filter: 'displayName sw "A"'}).read();
     */
    async read(ctx) {
        if (!this.id) {
            return new Messages.ListResponse((await Group.#egress(this, ctx) ?? [])
                .map(u => new Schemas.Group(u, "out", Group.basepath(), this.attributes)), this.constraints);
        } else {
            try {
                const source = [await Group.#egress(this, ctx)].flat().shift();
                if (!(source instanceof Object)) throw new Types.Error(500, null, `Unexpected ${source === undefined ? "empty" : "invalid"} value returned by handler`);
                else return new Schemas.Group(source, "out", Group.basepath(), this.attributes);
            } catch (ex) {
                if (ex instanceof Types.Error) throw ex;
                else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
                else throw new Types.Error(404, null, `Resource ${this.id} not found`);
            }
        }
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#write}
     * @returns {SCIMMY.Schemas.Group}
     * @example
     * // Create a new group with displayName "A Group"
     * await new SCIMMY.Resources.Group().write({displayName: "A Group"});
     * @example
     * // Set members attribute for group with ID "1234"
     * await new SCIMMY.Resources.Group("1234").write({members: [{value: "5678"}]});
     */
    async write(instance, ctx) {
        if (instance === undefined)
            throw new Types.Error(400, "invalidSyntax", `Missing request body payload for ${!!this.id ? "PUT" : "POST"} operation`);
        if (Object(instance) !== instance || Array.isArray(instance))
            throw new Types.Error(400, "invalidSyntax", `Operation ${!!this.id ? "PUT" : "POST"} expected request body payload to be single complex value`);
        
        try {
            const target = await Group.#ingress(this, new Schemas.Group(instance, "in"), ctx);
            if (!(target instanceof Object)) throw new Types.Error(500, null, `Unexpected ${target === undefined ? "empty" : "invalid"} value returned by handler`);
            else return new Schemas.Group(target, "out", Group.basepath(), this.attributes);
        } catch (ex) {
            if (ex instanceof Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
            else throw new Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#patch}
     * @see SCIMMY.Messages.PatchOp
     * @returns {SCIMMY.Schemas.Group}
     * @example
     * // Add member to group with ID "1234" with a patch operation (see SCIMMY.Messages.PatchOp)
     * await new SCIMMY.Resources.Group("1234").patch({Operations: [{op: "add", path: "members", value: {value: "5678"}}]});
     */
    async patch(message, ctx) {
        if (!this.id)
            throw new Types.Error(404, null, "PATCH operation must target a specific resource");
        if (message === undefined)
            throw new Types.Error(400, "invalidSyntax", "Missing message body from PatchOp request");
        if (Object(message) !== message || Array.isArray(message))
            throw new Types.Error(400, "invalidSyntax", "PatchOp request expected message body to be single complex value");
        
        return await new Messages.PatchOp(message)
            .apply(await this.read(ctx), async (instance) => await this.write(instance, ctx))
            .then(instance => !instance ? undefined : new Schemas.Group(instance, "out", Group.basepath(), this.attributes));
    }
    
    /** 
     * @implements {SCIMMY.Types.Resource#dispose}
     * @example
     * // Delete group with ID "1234"
     * await new SCIMMY.Resources.Group("1234").dispose();
     */
    async dispose(ctx) {
        if (!this.id)
            throw new Types.Error(404, null, "DELETE operation must target a specific resource");
        
        try {
            await Group.#degress(this, ctx);
        } catch (ex) {
            if (ex instanceof Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new Types.Error(500, null, ex.message);
            else throw new Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
}