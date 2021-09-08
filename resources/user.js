import {Resource} from "../types.js";

export class User extends Resource {
    static #ingress = () => {};
    static ingress(handler) {
        User.#ingress = handler;
        return User;
    }
    
    static #egress = () => {};
    static egress(handler) {
        User.#egress = handler;
        return User;
    }
    
    constructor(params) {
        super(params);
    }
    
    async read() {
        return await User.#egress(this);
    }
}