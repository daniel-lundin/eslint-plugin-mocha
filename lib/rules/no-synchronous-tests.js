'use strict';

var R = require('ramda');

module.exports = function (context) {
    var possibleAsyncFunctionNames = [
        'it',
        'it.only',
        'test',
        'test.only',
        'specify',
        'specify.only',
        'before',
        'after',
        'beforeEach',
        'afterEach',
        'Given',
        'When',
        'Then',
        'And'
    ];

    function getCalleeName(callee) {
        if (callee.type === 'MemberExpression') {
             return callee.object.name + '.' + callee.property.name;
        }

        return callee.name;
    }

    function hasParentMochaFunctionCall(functionExpression) {
        var name;

        if (functionExpression.parent && functionExpression.parent.type === 'CallExpression') {
            name = getCalleeName(functionExpression.parent.callee);
            return possibleAsyncFunctionNames.indexOf(name) > -1;
        }

        return false;
    }

    function hasAsyncCallback(functionExpression) {
        return functionExpression.params.length === 1;
    }

    function findAsyncCallback(nodes) {
        return R.find(function (node) {
            return (
                node.type === 'ExpressionStatement' &&
                node.expression.type === 'CallExpression' &&
                node.expression.arguments.length > 0 &&
                R.any(function (n) {
                    return n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression';
                }, node.expression.arguments)
            );
        }, nodes);
    }

    function checkHasExpressionWithCallback(functionExpression) {
        var bodyStatement = functionExpression.body,
            callbackExpression = null;
        if (bodyStatement.type === 'BlockStatement') {
            callbackExpression = findAsyncCallback(bodyStatement.body);
        }

        return callbackExpression;
    }

    function findPromiseReturnStatement(nodes) {
      return R.find(function (node) {
        return node.type === 'ReturnStatement' && node.argument && node.argument.type !== 'Literal';
      }, nodes);
    }

    function checkPromiseReturn(functionExpression) {
        var bodyStatement = functionExpression.body;

        if (bodyStatement.type === 'BlockStatement') {
            return findPromiseReturnStatement(functionExpression.body.body);
        } else if (bodyStatement.type === 'CallExpression') {
            //  allow arrow statements calling a promise with implicit return.
            return bodyStatement;
        }
        return null;
    }

    function check(node) {
        if (hasParentMochaFunctionCall(node) && !hasAsyncCallback(node)) {
            // var promiseReturn = checkPromiseReturn(node);
            if (!checkPromiseReturn(node)) {
                // var expressionWithCallback = checkHasExpressionWithCallback(node);
                if (checkHasExpressionWithCallback(node)) {
                    context.report(node, 'Unexpected synchronous test.');
                }
            }
        }
    }

    return {
        FunctionExpression: check,
        ArrowFunctionExpression: check
    };
};
