import {Schema, Attribute} from "../types.js";

export class Group {
    static get schema() {
        return Group.#schema;
    }
    
    static #schema = new Schema("Group", "urn:ietf:params:scim:schemas:core:2.0:Group", "Group", [
        new Attribute("string", "displayName", {required: true}),
        new Attribute("complex", "members", {multiValued: true, uniqueness: false}, [
            new Attribute("string", "value", {mutable: "immutable"}),
            new Attribute("reference", "$ref", {mutable: "immutable", referenceTypes: ["User", "Group"]}),
            new Attribute("string", "type", {mutable: "immutable", canonicalValues: ["User", "Group"]})
        ])
    ]);
    
    constructor(resource, direction = "both", basepath) {
        this.schemas = [Group.#schema.id];
        Object.assign(this, Group.#schema.coerce(resource, direction, basepath));
    }
}