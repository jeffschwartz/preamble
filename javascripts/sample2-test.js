/*jslint eqeq: true*/
/*jshint strict: false*/
/*global configure, when, beforeEach, beforeEachAsync, afterEach, afterEachAsync, then, thenAsync, whenDone, -getUiTestContainerElement, -getUiTestContainerElementId, proxy, equal, notEqual, isTrue, isFalse, isTruthy, isNotTruthy*/

/* 
 *This script uses BDD-like semantics. If you prefer TDD 
 *semantics, then please see javascripts\sample2-test.js.
 */ 

configure({
    name: 'Sample Test Suite (BDD-Like)',
    hidePassedTests: true
});

when('Runnig a test', function(){
    then('if it passes', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!', 'it looks like this');
    });
    then('if it fails', function(){
        isTrue(false, 'it looks like this');
    });
});

when('Evaluating boolean assertions', function(){
    then('bollean true', function(){
        isTrue(true, 'is true');
    });
    then('boolean false', function(){
        isFalse(false, 'is false');
    });
});

when('Evaluating truthy assertions', function(){
    then('undefined', function(){
        var undef;
        isNotTruthy(undef, 'is not truthy');
    });
    then('objects', function(){
        var def = {};
        isTruthy(def, 'are truthy');
    });
    then('numeric values other than 0', function(){
        var one = 1;
        isTruthy(one, 'are truthy');
    });
    then('numeric vaules that are 0', function(){
        var zero = 0;
        isNotTruthy(zero, 'are not truthy');
    });
    then('non empty strings', function(){
        isTruthy('not empty string', 'are truthy');
    });
    then('empty strings', function(){
        isNotTruthy('', 'are not truthy');
    });
});

when('Evaluating strict, deep recursive comparison assertions', function(){
    var char = 'b';
    var a = {a: 'a', b: 'b'};
    var b = {a: 'a', b: b};
    var c = {a: 'a', b: 'b'};
    then('2 objects with exactly the same properties and property values', function(){
        equal(a, c, 'are equal');
    });
    then('2 objects with different properties or property values', function(){
        notEqual(a, b, 'are not equal');
    });
    then('2 value types whose values are the same', function(){
        equal(char, 'b', 'are equal');
    });
    then('2 value types whose values are  not the same', function(){
        notEqual(char, 'a', 'are not equal');
    });
});

when('Running synchronous tests with beforeEach', function(){
    var count = 0;
    beforeEach(function(){
        count = 100;
    });
    then('beforeEach is called before the tests are called', function(){
        equal(count, 100, 'before test is called');
    });
});

when('Passing a value from beforeEach to tests', function(){
    beforeEach(function(valObj){
        valObj.value = 10;
    });
    then('the tests', function(valObj){
        equal(valObj.value, 10, 'can access the value');
    });
});

when('Running synchronous tests with afterEachTest', function(){
    var count = 0;
    afterEach(function(){
        count = 100;
    });
    then('the first test', function(){
        equal(count, 0, 'is not afftected');
    });
    then('but subsequent tests', function(){
        equal(count, 100, 'are affected');
    });
});

when('Running asynchronous tests', function(){
    var count = 0;
    thenAsync('calling whenDone', 1, function(){
        setTimeout(function(){
            count = 100;
        }, 1);
        whenDone(function(){
            equal(count, 100, 'causes the whenDone callback function to be called when asynchronous tests are done');
        });
    });
});

when('Running asynchronous tests with beforeEachAsync', function(){
    var count = 0;
    beforeEachAsync(1, function(){
        setTimeout(function(){
            count = 10;
        }, 1);
    });
    thenAsync('beforeEachAsync is called', 1, function(){
        setTimeout(function(){
            count *= 10;
        }, 1);
        whenDone(function(){
            equal(count, 100, 'before the asynchronous tests are called ');
        });
    });
});

when('Passing a value from beforeEachAsync to asynchronous tests', function(){
    beforeEachAsync(1, function(valObj){
        setTimeout(function(){
            valObj.value = 10;
        }, 1);
    });
    thenAsync('the asynchronous tests', 1, function(valObj){
        setTimeout(function(){
            //some asynchronous process...
        }, 1);
        whenDone(function(){
            equal(valObj.value, 10, 'can access the value');
        });
    });
});

when('Running asynchronous tests with afterEachAsync', function(){
    var count = 0;
    afterEachAsync(1, function(){
        setTimeout(function(){
            count = 1;
        }, 1);
    });
    thenAsync('the first asynchronous test', 1, function(){
        setTimeout(function(){
            count = 10;
        }, 1);
        whenDone(function(){
            isTrue(count === 10, 'is not affected');
        });
    });
    thenAsync('but subsequent asynchronous tests', 1, function(){
        setTimeout(function(){
            count *= 100;
        }, 1);
        whenDone(function(){
            isTrue(count === 100, 'are affected');
        });
    });
});

when('Proxy wraps a function and that function is called', function(){
    beforeEach(function(val){
        var fn = proxy(function(){
            return 'JavaScript is amazing!';
        });
        fn('Tell me something about JavaScript');
        val.fn = fn;
    });
    then('calling wasCalled(number) on that function', function(val){
        isTrue(val.fn.wasCalled(1), 'returns true if it was called that number times');
        isFalse(val.fn.wasCalled(2), 'and returns false if it was not called that number of times');
    });
    then('calling getCalledCount() on that function', function(val){
        equal(val.fn.getCalledCount(), 1, 'returns the number of times it was called');
    });
    then('calling getData(n) on that function', function(val){
        var info = val.fn.getData(0);
        notEqual(info, undefined, 'returns an object');
    });
    then('and the object that getData(n) returns exposes and api', function(val){
        var info = val.fn.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript', 'and calling argsPassed[n] returns the arguments that were passed to the function');
        equal(info.returned, 'JavaScript is amazing!', 'and calling returned() returns what the function returned');
        isTrue(info.context === undefined, 'and calling context() returns the context the function was called with');
    });
});

when('Proxy wraps a method and that function is called', function(){
    beforeEach(function(val){
        var someObject = {
            someMethod: function(){
                return 'JavaScript is amazing!';
            }
        };
        proxy(someObject, 'someMethod');
        someObject.someMethod('Tell me something about JavaScript');
        val.someObject = someObject;
    });
    then('calling wasCalled(number) on that method', function(val){
        isTrue(val.someObject.someMethod.wasCalled(1), 'returns true if it was called that number times');
        isFalse(val.someObject.someMethod.wasCalled(2), 'and returns false if it was not called that number of times');
    });
    then('calling getCalledCount() on that method', function(val){
        equal(val.someObject.someMethod.getCalledCount(), 1, 'returns the number of times it was called');
    });
    then('calling getData(n) on that method', function(val){
        var info = val.someObject.someMethod.getData(0);
        notEqual(info, undefined, 'returns an object');
    });
    then('and the object that getData(n) returns exposes and api', function(val){
        var info = val.someObject.someMethod.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript', 'and calling argsPassed[n] returns the arguments that were passed to the method');
        equal(info.returned, 'JavaScript is amazing!', 'and calling returned() returns what the function returned');
        isTrue(info.context === val.someObject, 'and calling context() returns the context the function was called with');
    });
});
