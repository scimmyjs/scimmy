import Types from "../types.js";
import Messages from "../messages.js";
import Schemas from "../schemas.js";

/**
 * SCIM User Resource
 * @alias SCIMMY.Resources.User
 * @summary
 * *   Handles read/write/patch/dispose operations for SCIM User resources with specified ingress/egress/degress methods.
 * *   Formats SCIM User resources for transmission/consumption using the `{@link SCIMMY.Schemas.User}` schema class.
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
        else User.#basepath = (path.endsWith(User.endpoint) ? path : `${path}${User.endpoint}`);
        
        return User;
    }
    
    /** @implements {SCIMMY.Types.Resource.schema} */
    static get schema() {
        return Schemas.User;
    }
    
    /** @private */
    static #ingress = () => {
        throw new Types.Error(501, null, "Method 'ingress' not implemented by resource 'User'");
    };
    
    /** @implements {SCIMMY.Types.Resource.ingress} */
    static ingress(handler) {
        User.#ingress = handler;
        return User;
    }
    
    /** @private */
    static #egress = () => {
        throw new Types.Error(501, null, "Method 'egress' not implemented by resource 'User'");
    };
    
    /** @implements {SCIMMY.Types.Resource.egress} */
    static egress(handler) {
        User.#egress = handler;
        return User;
    }
    
    /** @private */
    static #degress = () => {
        throw new Types.Error(501, null, "Method 'degress' not implemented by resource 'User'");
    };
    
    /** @implements {SCIMMY.Types.Resource.degress} */
    static degress(handler) {
        User.#degress = handler;
        return User;
    }
    
    /**
     * Instantiate a new SCIM User resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(...params) {
        super(...params);
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Schemas.User}
     * @example
     * // Retrieve user with ID "1234"
     * await new SCIMMY.Resources.User("1234").read();
     * @example
     * // Retrieve users with an email ending in "@example.com"
     * await new SCIMMY.Resources.User({filter: 'email.value ew "@example.com"'}).read();
     */
    async read(ctx) {
        try {
            const source = await User.#egress(this, ctx);
            const target = (this.id ? [source].flat().shift() : source);
            
            // If not looking for a specific resource, make sure egress returned an array
            if (!this.id && Array.isArray(target)) return new Messages.ListResponse(target
                .map(u => new Schemas.User(u, "out", User.basepath(), this.attributes)), this.constraints);
            // For specific resources, make sure egress returned an object
            else if (target instanceof Object) return new Schemas.User(target, "out", User.basepath(), this.attributes);
            // Otherwise, egress has not been implemented correctly
            else throw new Types.Error(500, null, `Unexpected ${target === undefined ? "empty" : "invalid"} value returned by handler`);
        } catch (ex) {
            if (ex instanceof Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
            else throw new Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#write}
     * @returns {SCIMMY.Schemas.User}
     * @example
     * // Create a new user with userName "someGuy"
     * await new SCIMMY.Resources.User().write({userName: "someGuy"});
     * @example
     * // Set userName attribute to "someGuy" for user with ID "1234"
     * await new SCIMMY.Resources.User("1234").write({userName: "someGuy"});
     */
    async write(instance, ctx) {
        if (instance === undefined)
            throw new Types.Error(400, "invalidSyntax", `Missing request body payload for ${!!this.id ? "PUT" : "POST"} operation`);
        if (Object(instance) !== instance || Array.isArray(instance))
            throw new Types.Error(400, "invalidSyntax", `Operation ${!!this.id ? "PUT" : "POST"} expected request body payload to be single complex value`);
        
        try {
            const target = await User.#ingress(this, new Schemas.User(instance, "in"), ctx);
            if (!(target instanceof Object)) throw new Types.Error(500, null, `Unexpected ${target === undefined ? "empty" : "invalid"} value returned by handler`);
            else return new Schemas.User(target, "out", User.basepath(), this.attributes);
        } catch (ex) {
            if (ex instanceof Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new Types.Error(400, "invalidValue", ex.message);
            else throw new Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#patch}
     * @see SCIMMY.Messages.PatchOp
     * @returns {SCIMMY.Schemas.User}
     * @example
     * // Set userName to "someGuy" for user with ID "1234" with a patch operation (see SCIMMY.Messages.PatchOp)
     * await new SCIMMY.Resources.User("1234").patch({Operations: [{op: "add", value: {userName: "someGuy"}}]});
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
            .then(instance => !instance ? undefined : new Schemas.User(instance, "out", User.basepath(), this.attributes));
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#dispose}
     * @example
     * // Delete user with ID "1234"
     * await new SCIMMY.Resources.User("1234").dispose();
     */
    async dispose(ctx) {
        if (!this.id)
            throw new Types.Error(404, null, "DELETE operation must target a specific resource");
        
        try {
            await User.#degress(this, ctx);
        } catch (ex) {
            if (ex instanceof Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new Types.Error(500, null, ex.message);
            else throw new Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
}