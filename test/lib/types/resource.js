import assert from "assert";
import {Resource} from "#@/lib/types/resource.js";
import {Filter} from "#@/lib/types/filter.js";
import {createSchemaClass} from "../../hooks/schemas.js";
import {createResourceClass} from "../../hooks/resources.js";

describe("SCIMMY.Types.Resource", () => {
    for (let member of ["endpoint", "schema"]) {
        describe(`.${member}`, () => {
            it("should be defined", () => {
                assert.ok(typeof Object.getOwnPropertyDescriptor(Resource, member).get === "function",
                    `Static member '${member}' was not defined`);
            });
            
            it("should be abstract", () => {
                assert.throws(() => Resource[member],
                    {name: "TypeError", message: `Method 'get' for property '${member}' not implemented by resource 'Resource'`},
                    `Static member '${member}' was not abstract`);
            });
        });
    }
    
    for (let method of ["basepath", "ingress", "egress", "degress"]) {
        describe(`.${method}()`, () => {
            it("should be defined", () => {
                assert.ok(typeof Resource[method] === "function",
                    `Static method '${method}' was not defined`);
            });
            
            it("should be abstract", () => {
                assert.throws(() => Resource[method](),
                    {name: "TypeError", message: `Method '${method}' not implemented by resource 'Resource'`},
                    `Static method '${method}' was not abstract`);
            });
        });
    }
    
    describe(".extend()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Resource.extend === "function",
                "Static method 'extend' was not implemented");
        });
    });
    
    describe(".describe()", () => {
        it("should be implemented", () => {
            assert.ok(typeof Resource.describe === "function",
                "Static method 'describe' was not implemented");
        });
        
        const TestResource = createResourceClass();
        const properties = [
            ["name"], ["description"], ["id", "name"], ["schema", "id"],
            ["endpoint", "name", `/${TestResource.schema.definition.name}`, ", with leading forward-slash"]
        ];
        
        for (let [prop, target = prop, expected = TestResource.schema.definition[target], suffix = ""] of properties) {
            it(`should expect '${prop}' property of description to equal '${target}' property of resource's schema definition${suffix}`, () => {
                assert.strictEqual(TestResource.describe()[prop], expected, 
                    `Static method 'describe' returned '${prop}' property with unexpected value`);
            });
        }
        
        it("should expect 'schemaExtensions' property to be excluded in description when resource is not extended", () => {
            assert.strictEqual(TestResource.describe().schemaExtensions, undefined,
                "Static method 'describe' unexpectedly included 'schemaExtensions' property in description");
        });
        
        it("should expect 'schemaExtensions' property to be included in description when resource is extended", function () {
            try {
                TestResource.extend(createSchemaClass({name: "Extension", id: "urn:ietf:params:scim:schemas:Extension"}));
            } catch {
                this.skip();
            }
            
            assert.ok(!!TestResource.describe().schemaExtensions,
                "Static method 'describe' did not include 'schemaExtensions' property in description");
            assert.deepStrictEqual(TestResource.describe().schemaExtensions, [{schema: "urn:ietf:params:scim:schemas:Extension", required: false}],
                "Static method 'describe' included 'schemaExtensions' property with unexpected value in description");
        });
    });
    
    describe("#filter", () => {
        it("should be an instance of Filter", () => {
            assert.ok(new Resource({filter: "userName eq \"Test\""}).filter instanceof Filter,
                "Instance member 'filter' was not an instance of Filter");
        });
    });
    
    describe("#attributes", () => {
        context("when 'excludedAttributes' query parameter was defined", () => {
            it("should be an instance of Filter", () => {
                const resource = new Resource({excludedAttributes: "name"});
                
                assert.ok(resource.attributes instanceof Filter,
                    "Instance member 'attributes' was not an instance of Filter");
            });
            
            it("should expect filter expression to be 'not present'", () => {
                const resource = new Resource({excludedAttributes: "name"});
                
                assert.ok(resource.attributes.expression === "name np",
                    "Instance member 'attributes' did not expect filter expression to be 'not present'");
            });
            
            it("should expect filter expression to be 'not present' for all specified attributes", () => {
                const resource = new Resource({excludedAttributes: "name,displayName"});
                
                assert.ok(resource.attributes.expression === "name np and displayName np",
                    "Instance member 'attributes' did not expect filter expression to be 'not present' for all specified attributes");
            });
        });
        
        context("when 'attributes' query parameter was defined", () => {
            it("should be an instance of Filter", () => {
                const resource = new Resource({attributes: "userName"});
                
                assert.ok(resource.attributes instanceof Filter,
                    "Instance member 'attributes' was not an instance of Filter");
            });
            
            it("should expect filter expression to be 'present'", () => {
                const resource = new Resource({attributes: "name"});
                
                assert.ok(resource.attributes.expression === "name pr",
                    "Instance member 'attributes' did not expect filter expression to be 'present'");
            });
            
            it("should expect filter expression to be 'present' for all specified attributes", () => {
                const resource = new Resource({attributes: "name,displayName"});
                
                assert.ok(resource.attributes.expression === "name pr and displayName pr",
                    "Instance member 'attributes' did not expect filter expression to be 'present' for all specified attributes");
            });
    
            it("should take precedence over 'excludedAttributes' when both defined", () => {
                const resource = new Resource({attributes: "name", excludedAttributes: "displayName"});
                
                assert.ok(resource.attributes.expression === "name pr",
                    "Instance member 'attributes' did not give precedence to 'attributes' query parameter");
            });
        });
    });
    
    describe("#constraints", () => {
        const suite = {sortBy: "name", sortOrder: "ascending", startIndex: 10, count: 10};
        const fixtures = [
            ["string value 'a string'", "a string", ["sortBy"]],
            ["number value '1'", 1, ["startIndex", "count"]],
            ["boolean value 'false'", false],
            ["object value", {}],
            ["array value", []]
        ];
        
        for (let [param, validValue] of Object.entries(suite)) {
            context(`when '${param}' query parameter was defined`, () => {
                it("should be an object", () => {
                    const resource = new Resource({[param]: validValue});
                    
                    assert.ok(typeof resource.constraints === "object",
                        `Instance member 'constraints' was not an object when '${param}' query parameter was defined`);
                });
                
                it(`should include '${param}' property equal to '${param}' query parameter value when it was valid`, () => {
                    const resource = new Resource({[param]: validValue});
    
                    assert.strictEqual(resource.constraints[param], suite[param],
                        `Instance member 'constraints' did not include '${param}' property equal to '${param}' query parameter value`);
                });
                
                for (let [label, value, validFor = []] of fixtures) if (!validFor.includes(param)) {
                    it(`should not include '${param}' property when '${param}' query parameter had invalid ${label}`, () => {
                        const resource = new Resource({[param]: value});
        
                        assert.ok(resource.constraints[param] === undefined,
                            `Instance member 'constraints' included '${param}' property when '${param}' query parameter had invalid ${label}`);
                    });
                }
                
                for (let [label, value, validFor = []] of fixtures) if (!validFor.includes(param)) {
                    it(`should include other valid properties when '${param}' query parameter had invalid ${label}`, () => {
                        const resource = new Resource({...suite, [param]: value});
                        const expected = JSON.parse(JSON.stringify({...suite, [param]: undefined}));
                        
                        assert.deepStrictEqual(resource.constraints, expected,
                            `Instance member 'constraints' did not include valid properties when '${param}' query parameter had invalid ${label}`);
                    });
                }
            });
        }
    });
    
    for (let method of ["read", "write", "patch", "dispose"]) {
        describe(`#${method}()`, () => {
            it("should be defined", () => {
                assert.ok(typeof (new Resource())[method] === "function",
                    `Instance method '${method}' was not defined`);
            });
            
            it("should be abstract", () => {
                assert.throws(() => new Resource()[method](),
                    {name: "TypeError", message: `Method '${method}' not implemented by resource 'Resource'`},
                    `Instance method '${method}' was not abstract`);
            });
        });
    }
});