export class ListResponse {
    constructor(resources = [], startIndex = 1, itemsPerPage = 20) {
        this.schemas = ["urn:ietf:params:scim:api:messages:2.0:ListResponse"];
        this.totalResults = resources.length;
        this.Resources = resources;
        this.startIndex = startIndex;
        this.itemsPerPage = itemsPerPage;
    }
}