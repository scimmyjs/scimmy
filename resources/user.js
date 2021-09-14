import {Resource, Error as SCIMError} from "../types.js";
import {ListResponse} from "../messages.js";
import {User as UserSchema} from "../schemas.js";

/**
 * SCIM User Resource
 * @extends {Resource}
 */
export class User extends Resource {
    /** @implements {Resource~schema} */
    static get schema() {
        return UserSchema;
    }
    
    /** @implements {Resource~#extensions} */
    static #extensions = [];
    /** @implements {Resource~extensions} */
    static get extensions() {
        return User.#extensions;
    }
    
    /** @implements {Resource~extend} */
    static extend(extension, required = false) {
        if (!User.#extensions.find(e => e.schema === extension))
            User.#extensions.push({schema: extension, required: required});
        
        return User;
    }
    
    /** @implements {Resource~endpoint} */
    static get endpoint() {
        return "/Users";
    }
    
    /** @implements {Resource~#basepath} */
    static #basepath;
    /** @implements {Resource~basepath} */
    static basepath(path) {
        if (path === undefined) return User.#basepath;
        else if (User.#basepath === undefined)
            User.#basepath = (path.endsWith(User.endpoint) ? path : `${path}${User.endpoint}`);
        
        return User;
    }
    
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
            return new ListResponse((await User.#egress(this))
                .map(u => new UserSchema(u, "out", User.basepath(), this.attributes))
                // TODO: account for start index and count when filtering here
                .filter(u => Object.keys(u).length > 1));
        } else {
            try {
                return new UserSchema((await User.#egress(this)).shift(), "out", User.basepath(), this.attributes);
            } catch (ex) {
                if (ex instanceof TypeError) throw new SCIMError(400, "invalidValue", ex.message);
                else throw new SCIMError(404, null, `Resource ${this.id} not found`);
            }
        }
    }
    
    /** @implements {Resource#write} */
    async write(instance) {
        return new UserSchema(
            await User.#ingress(this, new UserSchema(instance, "in")),
            "out", User.basepath(), this.attributes
        );
    }
}