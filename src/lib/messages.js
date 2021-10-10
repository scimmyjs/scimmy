import {Error} from "./messages/error.js";
import {ListResponse} from "./messages/listresponse.js";
import {PatchOp} from "./messages/patchop.js";

/**
 * SCIMMY Messages Container Class
 * @namespace SCIMMY.Messages
 */
export default class Messages {
    static Error = Error;
    static ListResponse = ListResponse;
    static PatchOp = PatchOp;
}