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

group('When using proxy', function(){
    test('on a function and the function is called', function(){
        var fn = proxy(function(){
            return 'JavaScript is amazing!';
        });
        fn('Tell me something about JavaScript');
        isTrue(fn.wasCalled(1), 'we can ask it if it was called "n" times');
        equal(fn.getCalledCount(), 1, 'we can ask it how many times it was called');
        var info1 = fn.getData(0);
        isTrue(info1.argsPassed[0] === 'Tell me something about JavaScript', 'we can find out what arguements it was passed');
        isTrue(info1.returned === 'JavaScript is amazing!', 'we can find out what it returned');
        isTrue(info1.context === undefined, 'we can verify the context that was used');
    });
    test('on a method and the method is called', function(){
        var someObject = {
            someMethod: function(){
                return 'JavaScript is amazing!';
            }
        };
        proxy(someObject, 'someMethod');
        someObject.someMethod('Tell me something about JavaScript');
        isTrue(someObject.someMethod.wasCalled(1), 'we can ask it if it was called "n" times');
        equal(someObject.someMethod.getCalledCount(), 1, 'we can ask it how many times it was called');
        var info1 = someObject.someMethod.getData(0);
        isTrue(info1.argsPassed[0] === 'Tell me something about JavaScript', 'we can find out what arguements it was passed');
        isTrue(info1.returned === 'JavaScript is amazing!', 'we can find out what it returned');
        isTrue(info1.context === someObject, 'we can verify the context that was used');
    });
});
