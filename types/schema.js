import {Attribute} from "./attribute.js";

/**
 * SCIM Schema
 */
export class Schema {
    /**
     * Constructs an instance of a full SCIM schema definition
     * @param {String} name - friendly name of the SCIM schema
     * @param {String} id - URN namespace of the SCIM schema
     * @param {String} description - a human-readable description of the schema
     * @param {Attribute[]} attributes - attributes that make up the schema
     */
    constructor(name = "", id = "", description = "", attributes = []) {
        // Store the schema name, ID, and description
        this.name = name;
        this.id = id;
        this.description = description;
        
        // Add common attributes used by all schemas, then add the schema-specific attributes
        this.attributes = [
            new Attribute("string", "id", {required: true, direction: "out", mutable: false, caseExact: true, uniqueness: "global"}),
            new Attribute("string", "externalId", {direction: "in", caseExact: true}),
            new Attribute("complex", "meta", {required: true, direction: "out", mutable: false}, [
                new Attribute("string", "resourceType", {required: true, direction: "out", mutable: false, caseExact: true}),
                new Attribute("dateTime", "created", {required: true, direction: "out", mutable: false}),
                new Attribute("dateTime", "lastModified", {required: true, direction: "out", mutable: false}),
                new Attribute("string", "location", {direction: "out", mutable: false}),
                new Attribute("string", "version", {direction: "out", mutable: false})
            ]),
            // Only include valid Attribute instances
            ...attributes.filter(attr => attr instanceof Attribute)
        ];
    }
}