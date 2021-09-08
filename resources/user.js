import {Resource} from "../types.js";
import {ListResponse} from "../messages.js";
import {User as UserSchema} from "../schemas.js";

/**
 * SCIM User Resource
 * @extends {Resource}
 */
export class User extends Resource {
    /** @implements {Resource~#ingress} */
    static #ingress = () => {};
    /** @implements {Resource~ingress} */
    static ingress(handler) {
        User.#ingress = handler;
        return User;
    }
    
    /** @implements {Resource~#egress} */
    static #egress = () => {};
    /** @implements {Resource~egress} */
    static egress(handler) {
        User.#egress = handler;
        return User;
    }
    
    /**
     * Instantiate a new SCIM User resource and parse any supplied parameters
     * @param {Object} [params={}] - the parameters of the user instance
     */
    constructor(params) {
        super(params);
    }
    
    /** @implements {Resource#read} */
    async read() {
        return new ListResponse((await User.#egress(this)).map(u => new UserSchema(u, "out")));
    }
}