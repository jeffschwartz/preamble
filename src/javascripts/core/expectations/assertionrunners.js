(function(){
    'use strict';
    var a_equals_true = require('./assertions.js').a_equals_true,
        a_equals_false = require('./assertions.js').a_equals_false,
        a_equals_b = require('./assertions.js').a_equals_b,
        a_notequals_b = require('./assertions.js').a_notequals_b,
        a_is_truthy = require('./assertions.js').a_is_truthy,
        a_is_not_truthy = require('./assertions.js').a_is_not_truthy;

    function argToPrintableValue(a){
        var s = '';
        a.forEach(function(el){
            s = s.length ? s + ',' : s;
            switch (typeof(el)){
                case 'string':
                    s += '\'' + el + '\'';
                    break;
                case 'function':
                    s += 'function';
                    break;
                case 'object':
                    s += JSON.stringify(el);
                    break;
                default:
                    s += el;
            }
        });
        return s;
    }

    function assertMockHasExpectations(a){
        var result = a_equals_true(a);
        return {result: result, explain: 'expected mock to have expectations'};
    }
    exports.assertMockHasExpectations = assertMockHasExpectations;

    function assertToHaveBeenCalled(a){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have been called'};
    }
    exports.assertToHaveBeenCalled = assertToHaveBeenCalled;

    function assertToNotHaveBeenCalled(a){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have been called'};
    }
    exports.assertToNotHaveBeenCalled = assertToNotHaveBeenCalled;

    function assertToHaveBeenCalledWith(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {
            result: result, explain: 'expected spy to have been called with ' + argToPrintableValue(b)};
    }
    exports.assertToHaveBeenCalledWith = assertToHaveBeenCalledWith;

    function assertToNotHaveBeenCalledWith(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {
            result: result, explain: 'expected spy to not have been called with ' + argToPrintableValue(b)};
    }
    exports.assertToNotHaveBeenCalledWith = assertToNotHaveBeenCalledWith;

    function assertToHaveBeenCalledWithContext(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have been called with context ' + JSON.stringify(b)};
    }
    exports.assertToHaveBeenCalledWithContext = assertToHaveBeenCalledWithContext;

    function assertToNotHaveBeenCalledWithContext(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have been called with context ' + JSON.stringify(b)};
    }
    exports.assertToNotHaveBeenCalledWithContext = assertToNotHaveBeenCalledWithContext;

    function assertToHaveReturned(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have returned ' + argToPrintableValue([b])};
    }
    exports.assertToHaveReturned = assertToHaveReturned;

    function assertToNotHaveReturned(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have returned ' + argToPrintableValue([b])};
    }
    exports.assertToNotHaveReturned = assertToNotHaveReturned;

    function assertToHaveThrown(a){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have thrown an exception'};
    }
    exports.assertToHaveThrown = assertToHaveThrown;

    function assertToNotHaveThrown(a){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have thrown an exception'};
    }
    exports.assertToNotHaveThrown = assertToNotHaveThrown;

    function assertToHaveThrownWithName(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have thrown an exception with the name ' + JSON.stringify(b)};
    }
    exports.assertToHaveThrownWithName = assertToHaveThrownWithName;

    function assertToNotHaveThrownWithName(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have thrown an exception with the name ' + JSON.stringify(b)};
    }
    exports.assertToNotHaveThrownWithName = assertToNotHaveThrownWithName;

    function assertToHaveThrownWithMessage(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have thrown an exception with the message ' + JSON.stringify(b)};
    }
    exports.assertToHaveThrownWithMessage = assertToHaveThrownWithMessage;

    function assertToNotHaveThrownWithMessage(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have thrown an exception with the message ' + JSON.stringify(b)};
    }
    exports.assertToNotHaveThrownWithMessage = assertToNotHaveThrownWithMessage;

    function assertEqual(a, b){
        //return a_equals_b(a, b);
        var result = a_equals_b(a, b);
        return {result: result, explain: 'expected ' + argToPrintableValue([a]) + ' to equal ' + argToPrintableValue([b])};
    }
    exports.assertEqual = assertEqual;

    function assertNotEqual(a, b){
        //return a_notequals_b(a, b);
        var result = a_notequals_b(a, b);
        return {result: result, explain: 'expected ' + argToPrintableValue([a]) + ' to not equal ' + argToPrintableValue([b])};
    }
    exports.assertNotEqual = assertNotEqual;

    function assertIsTrue(a){
        //return a_equals_true(a);
        var result = a_equals_true(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to be true' };
    }
    exports.assertIsTrue = assertIsTrue;

    function assertIsFalse(a){
        //return a_equals_false(a);
        var result = a_equals_false(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to be false'};
    }
    exports.assertIsFalse = assertIsFalse;

    function assertIsTruthy(a){
        //return a_is_truthy(a);
        var result = a_is_truthy(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to be truthy'};
    }
    exports.assertIsTruthy = assertIsTruthy;

    function assertIsNotTruthy(a){
        //return a_is_not_truthy(a);
        var result = a_is_not_truthy(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to not be truthy'};
    }
    exports.assertIsNotTruthy = assertIsNotTruthy;
}());
