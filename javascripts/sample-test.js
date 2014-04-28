/*jslint eqeq: true*/
/*jshint strict: false*/
/*global configure, group, beforeEachTest, asyncBeforeEachTest, afterEachTest, asyncAfterEachTest, test, asyncTest, whenAsyncDone, -getUiTestContainerElement, -getUiTestContainerElementId, proxy, equal, notEqual, isTrue, isFalse, isTruthy, isNotTruthy*/

configure({
    name: 'Sample Test Suite',
    hidePassedTests: true
});

group('When runnig a test', function(){
    test('and it passes', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!', 'it looks like this');
    });
    test('and it fails', function(){
        isTrue(false, 'it looks like this');
    });
});

group('When evaluating boolean assertions', function(){
    test('bollean true', function(){
        isTrue(true, 'is true');
    });
    test('boolean false', function(){
        isFalse(false, 'is false');
    });
});

group('When evaluating truthy assertions', function(){
    test('undefined', function(){
        var undef;
        isNotTruthy(undef, 'is not truthy');
    });
    test('objects', function(){
        var def = {};
        isTruthy(def, 'are truthy');
    });
    test('numeric values other than 0', function(){
        var one = 1;
        isTruthy(one, 'are truthy');
    });
    test('numeric vaules that are 0', function(){
        var zero = 0;
        isNotTruthy(zero, 'are not truthy');
    });
    test('non empty strings', function(){
        isTruthy('not empty string', 'are truthy');
    });
    test('empty strings', function(){
        isNotTruthy('', 'are not truthy');
    });
});

group('When evaluating strict, deep recursive comparison assertions', function(){
    var char = 'b';
    var a = {a: 'a', b: 'b'};
    var b = {a: 'a', b: b};
    var c = {a: 'a', b: 'b'};
    test('2 objects with exactly the same properties and property values', function(){
        equal(a, c, 'are equal');
    });
    test('2 objects with different properties or property values', function(){
        notEqual(a, b, 'are not equal');
    });
    test('2 value types whose values are the same', function(){
        equal(char, 'b', 'are equal');
    });
    test('2 value types whose values are  not the same', function(){
        notEqual(char, 'a', 'are not equal');
    });
});

group('When running a synchronous test with beforeEachTest', function(){
    var count = 0;
    beforeEachTest(function(){
        count = 100;
    });
    test('beforeEachTest is called', function(){
        equal(count, 100, 'before test is called');
    });
});

group('When passing a value from beforeEachTest to test', function(){
    beforeEachTest(function(valObj){
        valObj.value = 10;
    });
    test('the test', function(valObj){
        equal(valObj.value, 10, 'can access the value');
    });
});

group('When running a synchronous test with afterEachTest', function(){
    var count = 0;
    afterEachTest(function(){
        count = 100;
    });
    test('the first test', function(){
        equal(count, 0, 'is not afftected');
    });
    test('but subsequent tests', function(){
        equal(count, 100, 'are affected');
    });
});

group('When running an asynchronous test', function(){
    var count = 0;
    asyncTest('calling whenAsyncDone', 1, function(){
        setTimeout(function(){
            count = 100;
        }, 1);
        whenAsyncDone(function(){
            equal(count, 100, 'causes the whenAsyncDone callback function to be called when the asynchronous test has ended');
        });
    });
});

group('When running an asynchronous tests with asyncBeforeEachTest', function(){
    var count = 0;
    asyncBeforeEachTest(1, function(){
        setTimeout(function(){
            count = 10;
        }, 1);
    });
    asyncTest('asyncBeforeEachTest is called', 1, function(){
        setTimeout(function(){
            count *= 10;
        }, 1);
        whenAsyncDone(function(){
            equal(count, 100, 'before asyncTest is called ');
        });
    });
});

group('When passing a value from asyncBeforeEachTest to asyncTest', function(){
    asyncBeforeEachTest(1, function(valObj){
        setTimeout(function(){
            valObj.value = 10;
        }, 1);
    });
    asyncTest('the asyncTest', 1, function(valObj){
        setTimeout(function(){
            //some asynchronous process...
        }, 1);
        whenAsyncDone(function(){
            equal(valObj.value, 10, 'can access the value');
        });
    });
});

group('When running an asynchronous tests with asyncAfterEachTest', function(){
    var count = 0;
    asyncAfterEachTest(1, function(){
        setTimeout(function(){
            count = 1;
        }, 1);
    });
    asyncTest('the first asyncTest', 1, function(){
        setTimeout(function(){
            count = 10;
        }, 1);
        whenAsyncDone(function(){
            isTrue(count === 10, 'is not affected');
        });
    });
    asyncTest('but subsequent asyncTests', 1, function(){
        setTimeout(function(){
            count *= 100;
        }, 1);
        whenAsyncDone(function(){
            isTrue(count === 100, 'are affected');
        });
    });
});

group('When proxy wraps a function and that function is called', function(){
    beforeEachTest(function(val){
        var fn = proxy(function(){
            return 'JavaScript is amazing!';
        });
        fn('Tell me something about JavaScript');
        val.fn = fn;
    });
    test('then calling wasCalled(number) on that function', function(val){
        isTrue(val.fn.wasCalled(1), 'returns true if it was called that number times');
        isFalse(val.fn.wasCalled(2), 'and returns false if it was not called that number of times');
    });
    test('then calling getCalledCount() on that function', function(val){
        equal(val.fn.getCalledCount(), 1, 'returns the number of times it was called');
    });
    test('then calling getData(n) on that function', function(val){
        var info = val.fn.getData(0);
        notEqual(info, undefined, 'returns an object');
    });
    test('and the object that getData(n) returns exposes and api', function(val){
        var info = val.fn.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript', 'and calling argsPassed[n] returns the arguments that were passed to the function');
        equal(info.returned, 'JavaScript is amazing!', 'and calling returned() returns what the function returned');
        isTrue(info.context === undefined, 'and calling context() returns the context the function was called with');
    });
});

group('When proxy wraps a method and that function is called', function(){
    beforeEachTest(function(val){
        var someObject = {
            someMethod: function(){
                return 'JavaScript is amazing!';
            }
        };
        proxy(someObject, 'someMethod');
        someObject.someMethod('Tell me something about JavaScript');
        val.someObject = someObject;
    });
    test('then calling wasCalled(number) on that method', function(val){
        isTrue(val.someObject.someMethod.wasCalled(1), 'returns true if it was called that number times');
        isFalse(val.someObject.someMethod.wasCalled(2), 'and returns false if it was not called that number of times');
    });
    test('then calling getCalledCount() on that method', function(val){
        equal(val.someObject.someMethod.getCalledCount(), 1, 'returns the number of times it was called');
    });
    test('then calling getData(n) on that method', function(val){
        var info = val.someObject.someMethod.getData(0);
        notEqual(info, undefined, 'returns an object');
    });
    test('and the object that getData(n) returns exposes and api', function(val){
        var info = val.someObject.someMethod.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript', 'and calling argsPassed[n] returns the arguments that were passed to the method');
        equal(info.returned, 'JavaScript is amazing!', 'and calling returned() returns what the function returned');
        isTrue(info.context === val.someObject, 'and calling context() returns the context the function was called with');
    });
});

