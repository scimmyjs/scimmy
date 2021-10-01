import Types from "../types.js";
import Messages from "../messages.js";
import Schemas from "../schemas.js";

/**
 * SCIM Group Resource
 * @class SCIMMY.Resources.Group
 */
export class Group extends Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/Groups";
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.#basepath}
     * @private
     */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return Group.#basepath;
        else if (Group.#basepath === undefined)
            Group.#basepath = (path.endsWith(Group.endpoint) ? path : `${path}${Group.endpoint}`);
        
        return Group;
    }
    
    /** @implements {SCIMMY.Types.Resource.schema} */
    static get schema() {
        return Schemas.Group;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.#extensions}
     * @private
     */
    static #extensions = [];
    /** @implements {SCIMMY.Types.Resource.extensions} */
    static get extensions() {
        return Group.#extensions;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.#ingress}
     * @private
     */
    static #ingress = () => {};
    /** @implements {SCIMMY.Types.Resource.ingress} */
    static ingress(handler) {
        Group.#ingress = handler;
        return Group;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.#egress}
     * @private
     */
    static #egress = () => {};
    /** @implements {SCIMMY.Types.Resource.egress} */
    static egress(handler) {
        Group.#egress = handler;
        return Group;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.#degress}
     * @private
     */
    static #degress = () => {};
    /** @implements {SCIMMY.Types.Resource.degress} */
    static degress(handler) {
        Group.#degress = handler;
        return Group;
    }
    
    /**
     * Instantiate a new SCIM Group resource and parse any supplied parameters
     * @implements {SCIMMY.Types.Resource#constructor}
     */
    constructor(params, ...rest) {
        super(params, ...rest);
    }
    
    /** @implements {SCIMMY.Types.Resource#read} */
    async read() {
        if (!this.id) {
            return new Messages.ListResponse((await Group.#egress(this))
                .map(u => new Schemas.Group(u, "out", Group.basepath(), this.attributes)), this.constraints);
        } else {
            try {
                return new Schemas.Group((await Group.#egress(this)).shift(), "out", Group.basepath(), this.attributes);
            } catch (ex) {
                if (ex instanceof Types.Error) throw ex;
                else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
                else throw new Types.Error(404, null, `Resource ${this.id} not found`);
            }
        }
    }
    
    /** @implements {SCIMMY.Types.Resource#write} */
    async write(instance) {
        try {
            // TODO: handle incoming read-only and immutable attribute tests
            return new Schemas.Group(
                await Group.#ingress(this, new Schemas.Group(instance, "in")),
                "out", Group.basepath(), this.attributes
            );
        } catch (ex) {
            if (ex instanceof Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
            else throw new Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
    
    /** @implements {SCIMMY.Types.Resource#patch} */
    async patch(request) {
        try {
            return await new Messages.PatchOp(request, new Schemas.Group((await Group.#egress(this)).shift(), "out"))
                .apply(async (instance) => await Group.#ingress(this, instance))
                .then(instance => !instance ? undefined : new Schemas.Group(instance, "out", Group.basepath(), this.attributes));
        } catch (ex) {
            if (ex instanceof Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
            else throw new Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
    
    /** @implements {SCIMMY.Types.Resource#dispose} */
    async dispose() {
        if (!!this.id) await Group.#degress(this);
        else throw new Types.Error(404, null, `Resource ${this.id} not found`);
    }
}