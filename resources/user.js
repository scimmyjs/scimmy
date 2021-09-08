import {Resource, Error as SCIMError} from "../types.js";
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
     * @implements {Resource#constructor}
     */
    constructor(params, ...rest) {
        super(params, ...rest);
    }
    
    /** @implements {Resource#read} */
    async read() {
        if (!this.id) {
            return new ListResponse((await User.#egress(this)).map(u => new UserSchema(u, "out")));
        } else {
            try {
                return new UserSchema((await User.#egress(this)).shift(), "out");
            } catch (ex) {
                if (ex instanceof TypeError) throw new SCIMError(400, "invalidValue", ex.message);
                else throw new SCIMError(404, null, `Resource ${this.id} not found`);
            }
        }
    }
}