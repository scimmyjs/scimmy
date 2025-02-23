import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";
import {ErrorResponse} from "#@/lib/messages/error.js";

// Load data to use in tests from adjacent JSON file
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
const fixtures = fs.readFile(path.join(basepath, "./error.json"), "utf8").then((f) => JSON.parse(f));
// Default parameter values to use in tests
const params = {id: "urn:ietf:params:scim:api:messages:2.0:Error"};
const template = {schemas: [params.id], status: "500"};

describe("SCIMMY.Messages.Error", () => {
    it("should extend native 'Error' class", () => {
        assert.ok(new ErrorResponse() instanceof Error,
            "SCIM Error message class did not extend native 'Error' class");
    });
    
    describe("@constructor", () => {
        it("should not require arguments", () => {
            assert.deepStrictEqual({...(new ErrorResponse())}, template,
                "SCIM Error message did not instantiate with correct default properties");
        });
        
        it("should rethrow inbound SCIM Error messages at instantiation", async () => {
            const {inbound: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.throws(() => new ErrorResponse(fixture),
                    {name: "SCIMError", message: fixture.detail, status: fixture.status, scimType: fixture.scimType},
                    `Inbound SCIM Error message fixture #${suite.indexOf(fixture)+1} not rethrown at instantiation`);
            }
        });
        
        it("should not accept invalid HTTP status codes for 'status' parameter", () => {
            assert.throws(() => new ErrorResponse({status: "a string"}),
                {name: "TypeError", message: "Incompatible HTTP status code 'a string' supplied to SCIM Error Message constructor"},
                "Error message instantiated with invalid 'status' parameter 'a string'");
            assert.throws(() => new ErrorResponse({status: 402}),
                {name: "TypeError", message: "Incompatible HTTP status code '402' supplied to SCIM Error Message constructor"},
                "Error message instantiated with invalid 'status' parameter '402'");
        });
        
        it("should not accept unknown values for 'scimType' parameter", () => {
            assert.throws(() => new ErrorResponse({scimType: "a string"}),
                {name: "TypeError", message: "Unknown detail error keyword 'a string' supplied to SCIM Error Message constructor"},
                "Error message instantiated with invalid 'scimType' parameter 'a string'");
        });
        
        it("should verify 'scimType' value is valid for a given 'status' code", async () => {
            const {outbound: {valid, invalid}} = await fixtures;
            
            for (let fixture of valid) {
                assert.deepStrictEqual({...(new ErrorResponse(fixture))}, {...template, ...fixture}, 
                    `Error message type check 'valid' fixture #${valid.indexOf(fixture) + 1} did not produce expected output`);
            }
            
            for (let fixture of invalid) {
                assert.throws(() => new ErrorResponse(fixture),
                    {name: "TypeError", message: `HTTP status code '${fixture.status}' not valid for detail error keyword '${fixture.scimType}' in SCIM Error Message constructor`},
                    `Error message instantiated with invalid 'scimType' and 'status' parameters in type check 'invalid' fixture #${valid.indexOf(fixture) + 1}`);
            }
        });
    });
    
    describe(".id", () => {
        it("should be defined", () => {
            assert.ok("id" in ErrorResponse,
                "Static member 'id' not defined");
        });
        
        it("should be a string", () => {
            assert.ok(typeof ErrorResponse.id === "string",
                "Static member 'id' was not a string");
        });
        
        it("should match SCIM Error Message schema ID", async () => {
            assert.strictEqual(ErrorResponse.id, params.id,
                "Static member 'id' did not match SCIM Error Message schema ID");
        });
    });
});