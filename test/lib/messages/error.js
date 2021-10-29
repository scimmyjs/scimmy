import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";

export let ErrorSuite = (SCIMMY) => {
    const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
    const fixtures = fs.readFile(path.join(basepath, "./error.json"), "utf8").then((f) => JSON.parse(f));
    
    it("should include static class 'Error'", () => 
        assert.ok(!!SCIMMY.Messages.Error, "Static class 'Error' not defined"));
    
    describe("SCIMMY.Messages.Error", () => {
        it("should not require 'ex' argument at instantiation", () => {
            assert.deepStrictEqual(
                {...(new SCIMMY.Messages.Error())}, {status: "500", schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"]},
                "SCIM Error message did not instantiate with correct default properties"
            );
        });
        
        it("should rethrow inbound SCIM Error messages at instantiation", async () => {
            let {rethrow: suite} = await fixtures;
            
            for (let fixture of suite) {
                assert.throws(() => new SCIMMY.Messages.Error(fixture),
                    {name: "SCIMError", message: fixture.detail, status: fixture.status, scimType: fixture.scimType},
                    `Inbound SCIM Error message fixture #${suite.indexOf(fixture)+1} not rethrown at instantiation`
                );
            }
        });
        
        it("should not accept invalid HTTP status codes for 'status' parameter", () => {
            assert.throws(() => new SCIMMY.Messages.Error({status: "a string"}),
                {name: "TypeError", message: "Incompatible HTTP status code 'a string' supplied to SCIM Error Message constructor"},
                "Error message instantiated with invalid 'status' parameter 'a string'"
            );
    
            assert.throws(() => new SCIMMY.Messages.Error({status: 402}),
                {name: "TypeError", message: "Incompatible HTTP status code '402' supplied to SCIM Error Message constructor"},
                "Error message instantiated with invalid 'status' parameter '402'"
            );
        });
        
        it("should not accept unknown values for 'scimType' parameter", () => {
            assert.throws(() => new SCIMMY.Messages.Error({scimType: "a string"}),
                {name: "TypeError", message: "Unknown detail error keyword 'a string' supplied to SCIM Error Message constructor"},
                "Error message instantiated with invalid 'scimType' parameter 'a string'"
            );
        });
        
        it("should verify 'scimType' value is valid for a given 'status' code", async () => {
            let {typeChecks: {valid, invalid}} = await fixtures;
            
            for (let fixture of valid) {
                let actual = new SCIMMY.Messages.Error(fixture),
                    expected = {schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], ...fixture};
    
                assert.deepStrictEqual({...actual}, expected, 
                    `Error message type check 'valid' fixture #${valid.indexOf(fixture) + 1} did not produce expected output`
                );
            }
    
            for (let fixture of invalid) {
                assert.throws(() => new SCIMMY.Messages.Error(fixture),
                    {name: "TypeError", message: `HTTP status code '${fixture.status}' not valid for detail error keyword '${fixture.scimType}' in SCIM Error Message constructor`},
                    `Error message instantiated with invalid 'scimType' and 'status' parameters in type check 'invalid' fixture #${valid.indexOf(fixture) + 1}`
                );
            }
        });
    });
}