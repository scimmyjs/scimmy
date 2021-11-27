import assert from "assert";
import {ErrorSuite} from "./messages/error.js";
import {ListResponseSuite} from "./messages/listresponse.js";
import {PatchOpSuite} from "./messages/patchop.js";
import {BulkRequestSuite} from "./messages/bulkrequest.js";
import {BulkResponseSuite} from "./messages/bulkresponse.js";
import {SearchRequestSuite} from "./messages/searchrequest.js";

export let MessagesSuite = (SCIMMY) => {
    it("should include static class 'Messages'", () => 
        assert.ok(!!SCIMMY.Messages, "Static class 'Messages' not defined"));
    
    describe("SCIMMY.Messages", () => {
        ErrorSuite(SCIMMY);
        ListResponseSuite(SCIMMY);
        PatchOpSuite(SCIMMY);
        BulkRequestSuite(SCIMMY);
        BulkResponseSuite(SCIMMY);
        SearchRequestSuite(SCIMMY);
    });
}