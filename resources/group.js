import {Resource, Error as SCIMError} from "../types.js";
import {ListResponse} from "../messages.js";
import {Group as GroupSchema} from "../schemas.js";

/**
 * SCIM Group Resource
 * @extends {Resource}
 */
export class Group extends Resource {
    /** @implements {Resource~schema} */
    static get schema() {
        return GroupSchema;
    }
    
    /** @implements {Resource~#extensions} */
    static #extensions = [];
    /** @implements {Resource~extensions} */
    static get extensions() {
        return Group.#extensions;
    }
    
    /** @implements {Resource~extend} */
    static extend(extension, required = false) {
        if (!Group.#extensions.find(e => e.schema === extension))
            Group.#extensions.push({schema: extension, required: required});
        
        return Group;
    }
    
    /** @implements {Resource~endpoint} */
    static get endpoint() {
        return "/Groups";
    }
    
    /** @implements {Resource~#basepath} */
    static #basepath;
    /** @implements {Resource~basepath} */
    static basepath(path) {
        if (path === undefined) return Group.#basepath;
        else if (Group.#basepath === undefined)
            Group.#basepath = (path.endsWith(Group.endpoint) ? path : `${path}${Group.endpoint}`);
        
        return Group;
    }
    
    /** @implements {Resource~#ingress} */
    static #ingress = () => {};
    /** @implements {Resource~ingress} */
    static ingress(handler) {
        Group.#ingress = handler;
        return Group;
    }
    
    /** @implements {Resource~#egress} */
    static #egress = () => {};
    /** @implements {Resource~egress} */
    static egress(handler) {
        Group.#egress = handler;
        return Group;
    }
    
    /** @implements {Resource~#degress} */
    static #degress = () => {};
    /** @implements {Resource~degress} */
    static degress(handler) {
        Group.#degress = handler;
        return Group;
    }
    
    /**
     * Instantiate a new SCIM Group resource and parse any supplied parameters
     * @implements {Resource#constructor}
     */
    constructor(params, ...rest) {
        super(params, ...rest);
    }
    
    /** @implements {Resource#read} */
    async read() {
        if (!this.id) {
            return new ListResponse((await Group.#egress(this))
                .map(u => new GroupSchema(u, "out", Group.basepath(), this.attributes))
                // TODO: account for start index and count when filtering here
                .filter(u => Object.keys(u).length > 1));
        } else {
            try {
                return new GroupSchema((await Group.#egress(this)).shift(), "out", Group.basepath(), this.attributes);
            } catch (ex) {
                if (ex instanceof TypeError) throw new SCIMError(400, "invalidValue", ex.message);
                else throw new SCIMError(404, null, `Resource ${this.id} not found`);
            }
        }
    }
    
    /** @implements {Resource#write} */
    async write(instance) {
        return new GroupSchema(
            await Group.#ingress(this, new GroupSchema(instance, "in")),
            "out", Group.basepath(), this.attributes
        );
    }
    
    /** @implements {Resource#dispose} */
    async dispose() {
        if (!!this.id) await Group.#degress(this);
        else throw new SCIMError(404, null, `Resource ${this.id} not found`);
    }
}