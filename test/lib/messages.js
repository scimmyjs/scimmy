import assert from "assert";
import SCIMMY from "#@/scimmy.js";
import {ErrorSuite} from "./messages/error.js";
import {ListResponseSuite} from "./messages/listresponse.js";
import {PatchOpSuite} from "./messages/patchop.js";
import {BulkRequestSuite} from "./messages/bulkrequest.js";
import {BulkResponseSuite} from "./messages/bulkresponse.js";
import {SearchRequestSuite} from "./messages/searchrequest.js";

export const MessagesSuite = () => {
    it("should include static class 'Messages'", () => 
        assert.ok(!!SCIMMY.Messages, "Static class 'Messages' not defined"));
    
    describe("SCIMMY.Messages", () => {
        ErrorSuite();
        ListResponseSuite();
        PatchOpSuite();
        BulkRequestSuite();
        BulkResponseSuite();
        SearchRequestSuite();
    });
};