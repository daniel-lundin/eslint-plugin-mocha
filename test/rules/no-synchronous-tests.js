'use strict';

var RuleTester = require('eslint').RuleTester,
    rules = require('../../').rules,
    ruleTester = new RuleTester();

ruleTester.run('no-synchronous-tests', rules['no-synchronous-tests'], {
    valid: [
        'it();',
        'it("");',
        'it("", function() { })',
        'it("", function() { aFunctionCall(); })',
        'it("", function() { expect(true).to.be.ok(); })',
        'it("", function() { return promise(); })',
        'it("", function() { return promise().then(function() { expected() }) })',
        'it("", function(done) { getData(function() { done(); }) })',
        'ignoredFunction(function() { })',
        'var x = 1;',
        'var foo = function() { }',
        {
            code: 'it("", () => promise() )',
            parserOptions: { ecmaVersion: 6 }
        },
        {
            code: 'it("", () => promise )',
            parserOptions: { ecmaVersion: 6 }
        }

    ],
    invalid: [
        {
            code: 'it("", function() { getData(function(data) { expect(expected).to.be.present() }); })',
            errors: [ { message: 'Unexpected synchronous test.' } ]
        }
    ]
});
