import Types from "../types.js";
import Messages from "../messages.js";
import Schemas from "../schemas.js";

/**
 * SCIM User Resource
 * @alias SCIMMY.Resources.User
 */
export class User extends Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/Users";
    }
    
    /** @private */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return User.#basepath;
        else if (User.#basepath === undefined)
            User.#basepath = (path.endsWith(User.endpoint) ? path : `${path}${User.endpoint}`);
        
        return User;
    }
    
    /** @implements {SCIMMY.Types.Resource.schema} */
    static get schema() {
        return Schemas.User;
    }
    
    /** @private */
    static #extensions = [];
    /** @implements {SCIMMY.Types.Resource.extensions} */
    static get extensions() {
        return User.#extensions;
    }
    
    /** @private */
    static #ingress = () => {};
    /** @implements {SCIMMY.Types.Resource.ingress} */
    static ingress(handler) {
        User.#ingress = handler;
        return User;
    }
    
    /** @private */
    static #egress = () => {};
    /** @implements {SCIMMY.Types.Resource.egress} */
    static egress(handler) {
        User.#egress = handler;
        return User;
    }
    
    /** @private */
    static #degress = () => {};
    /** @implements {SCIMMY.Types.Resource.degress} */
    static degress(handler) {
        User.#degress = handler;
        return User;
    }
    
    /**
     * Instantiate a new SCIM User resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(params, ...rest) {
        super(params, ...rest);
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Schemas.User}
     */
    async read() {
        if (!this.id) {
            return new Messages.ListResponse((await User.#egress(this))
                .map(u => new Schemas.User(u, "out", User.basepath(), this.attributes)), this.constraints);
        } else {
            try {
                return new Schemas.User((await User.#egress(this)).shift(), "out", User.basepath(), this.attributes);
            } catch (ex) {
                if (ex instanceof Types.Error) throw ex;
                else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
                else throw new Types.Error(404, null, `Resource ${this.id} not found`);
            }
        }
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#write}
     * @returns {SCIMMY.Schemas.User}
     */
    async write(instance) {
        try {
            // TODO: handle incoming read-only and immutable attribute tests
            return new Schemas.User(
                await User.#ingress(this, new Schemas.User(instance, "in")),
                "out", User.basepath(), this.attributes
            );
        } catch (ex) {
            if (ex instanceof Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
            else throw new Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#patch}
     * @returns {SCIMMY.Schemas.User}
     */
    async patch(message) {
        try {
            return await new Messages.PatchOp(message, new Schemas.User((await User.#egress(this)).shift(), "out"))
                .apply(async (instance) => await User.#ingress(this, instance))
                .then(instance => !instance ? undefined : new Schemas.User(instance, "out", User.basepath(), this.attributes));
        } catch (ex) {
            if (ex instanceof Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
            else throw new Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
    
    /** @implements {SCIMMY.Types.Resource#dispose} */
    async dispose() {
        if (!!this.id) await User.#degress(this);
        else throw new Types.Error(404, null, `Resource ${this.id} not found`);
    }
}