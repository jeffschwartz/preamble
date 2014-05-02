/*jslint eqeq: true*/
/*jshint strict: false*/
/*global configure, group, beforeEachTest, asyncBeforeEachTest, afterEachTest, asyncAfterEachTest, test, asyncTest, whenAsyncDone, -getUiTestContainerElement, -getUiTestContainerElementId, snoop, proxy, equal, notEqual, isTrue, isFalse, isTruthy, isNotTruthy*/

/* 
 * This script uses TDD semantics. If you prefer BDD-like 
 * semantics, then please see javascripts\sample2-test.js.
 */ 

configure({
    name: 'Sample Test Suite (TDD)',
    hidePassedTests: true
});

group('When runnig a test', function(){
    test('and it passes', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!');
    });
    test('and it fails', function(){
        isTrue(false);
    });
});

group('When evaluating boolean assertions', function(){
    test('bollean true', function(){
        isTrue(true);
    });
    test('boolean false', function(){
        isFalse(false);
    });
});

group('When evaluating truthy assertions', function(){
    test('undefined', function(){
        var undef;
        isNotTruthy(undef);
    });
    test('objects', function(){
        var def = {};
        isTruthy(def);
    });
    test('numeric values other than 0', function(){
        var one = 1;
        isTruthy(one);
    });
    test('numeric vaules that are 0', function(){
        var zero = 0;
        isNotTruthy(zero);
    });
    test('non empty strings', function(){
        isTruthy('not empty string');
    });
    test('empty strings', function(){
        isNotTruthy('');
    });
});

group('When evaluating strict, deep recursive comparison assertions', function(){
    var char = 'b';
    var a = {a: 'a', b: 'b'};
    var b = {a: 'a', b: b};
    var c = {a: 'a', b: 'b'};
    test('2 objects with exactly the same properties and property values', function(){
        equal(a, c);
    });
    test('2 objects with different properties or property values', function(){
        notEqual(a, b);
    });
    test('2 value types whose values are the same', function(){
        equal(char, 'b');
    });
    test('2 value types whose values are  not the same', function(){
        notEqual(char, 'a');
    });
});

group('When running a synchronous test with beforeEachTest', function(){
    var count = 0;
    beforeEachTest(function(){
        count = 100;
    });
    test('beforeEachTest is called', function(){
        equal(count, 100);
    });
});

group('When passing a value from beforeEachTest to test', function(){
    beforeEachTest(function(valObj){
        valObj.value = 10;
    });
    test('the test', function(valObj){
        equal(valObj.value, 10);
    });
});

group('When running a synchronous test with afterEachTest', function(){
    var count = 0;
    afterEachTest(function(){
        count = 100;
    });
    test('the first test', function(){
        equal(count, 0);
    });
    test('but subsequent tests', function(){
        equal(count, 100);
    });
});

group('When running an asynchronous test', function(){
    var count = 0;
    asyncTest('calling whenAsyncDone', 1, function(){
        setTimeout(function(){
            count = 100;
        }, 1);
        whenAsyncDone(function(){
            equal(count, 100);
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
            equal(count, 100);
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
            equal(valObj.value, 10);
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
            isTrue(count === 10);
        });
    });
    asyncTest('but subsequent asyncTests', 1, function(){
        setTimeout(function(){
            count *= 100;
        }, 1);
        whenAsyncDone(function(){
            isTrue(count === 100);
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
        isTrue(val.fn.wasCalled(1));
        isFalse(val.fn.wasCalled(2));
    });
    test('then calling getCalledCount() on that function', function(val){
        equal(val.fn.getCalledCount(), 1);
    });
    test('then calling getData(n) on that function', function(val){
        var info = val.fn.getData(0);
        notEqual(info, undefined);
    });
    test('and the object that getData(n) returns exposes and api', function(val){
        var info = val.fn.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript');
        equal(info.returned, 'JavaScript is amazing!');
        equal(info.context, undefined);
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
        isTrue(val.someObject.someMethod.wasCalled(1));
        isFalse(val.someObject.someMethod.wasCalled(2));
    });
    test('then calling getCalledCount() on that method', function(val){
        equal(val.someObject.someMethod.getCalledCount(), 1);
    });
    test('then calling getData(n) on that method', function(val){
        var info = val.someObject.someMethod.getData(0);
        notEqual(info, undefined);
    });
    test('and the object that getData(n) returns exposes and api', function(val){
        var info = val.someObject.someMethod.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript');
        equal(info.returned, 'JavaScript is amazing!');
        equal(info.context, val.someObject);
    });
});

group('When snooping on a method', function(){
    beforeEachTest(function(val){
        val.foo = {
            someFn: function(arg){
                return arg;
            }
        };
    });
    test('then querying if the method was called', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled());
    });
    test('then querying how many times the method was called', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.called(), 1);
    });
    test('then querying if the method was called n times', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled.nTimes(1));
        isFalse(foo.someFn.wasCalled.nTimes(2));
    });
    test('then querying the context the method was called with', function(val){
        var foo = val.foo,
            bar = {};
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.contextCalledWith(), foo);
        notEqual(foo.someFn.contextCalledWith(), bar);
    });
    test('then querying for the arguments that the method was called with', function(val){
        var foo = val.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.args.getArgument(0), arg);
        notEqual(foo.someFn.args.getArgument(0), arg + '!');
        isNotTruthy(foo.someFn.args.getArgument(1));
    });
    test('then we can query for what the method returned', function(val){
        var foo = val.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.returned(), arg);
        notEqual(foo.someFn.returned(), arg + '!');
    });
});

group('When a snooped method throws', function(){
    beforeEachTest(function(val){
        val.foo = {
            someFn: function(){
                throw new Error('Holy Batman!');
            }
        };
    });
    test('then we can query the method it threw', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.threw());
        isTrue(foo.someFn.threw.withMessage('Holy Batman!'));
        isFalse(foo.someFn.threw.withMessage('Holy Batman!!'));
    });
});

group('When snooping on more than one method', function(){
    beforeEachTest(function(val){
        val.foo = {
            someFn: function(arg){
                return arg;
            }
        };
        val.bar = {
            someFn: function(arg){
                return arg;
            }
        };
    });
    test('then snoops are isolated and there are no side effects', function(val){
        var foo = val.foo,
            bar = val.bar;
        snoop(foo, 'someFn');
        snoop(bar, 'someFn');
        foo.someFn('Is Preamble great?');
        bar.someFn('Yes it is!');
        foo.someFn('You got that right!');
        isTrue(foo.someFn.wasCalled());
        isTrue(foo.someFn.wasCalled.nTimes(2));
        isFalse(foo.someFn.wasCalled.nTimes(1));
        isTrue(bar.someFn.wasCalled());
        isTrue(bar.someFn.wasCalled.nTimes(1));
        isFalse(bar.someFn.wasCalled.nTimes(2));
    });
});

group('When the "calls" api is used', function(){
    var i, 
        foo = {
            someFn: function(arg){
                return arg;
            }
        },
        bar ={},
        n = 3,
        aCall;
    snoop(foo, 'someFn');
    for(i = 0; i < n; i++){
        foo.someFn(i) ;
    }
    test('then count() returns', function(){
        equal(foo.someFn.calls.count(), n);
    });
    test('then all() returns', function(){
        equal(foo.someFn.calls.all().length, n);
    });
    test('then forCall(n) returns the correct element', function(){
        for(i = 0; i < n; i++){
            aCall = foo.someFn.calls.forCall(i);
            equal(aCall.context, foo);
            notEqual(aCall.context, bar);
            equal(aCall.args[0], i);
            notEqual(aCall.args[0], n);
            isNotTruthy(aCall.error);
            equal(aCall.returned, i);
            notEqual(aCall.returned, n);
        }
    });
});
