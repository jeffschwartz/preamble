/*jslint eqeq: true*/
/*jshint strict: false*/
/*global configure, when, beforeEach, beforeEachAsync, afterEach, afterEachAsync, then, thenAsync, whenDone, -getUiTestContainerElement, -getUiTestContainerElementId, snoop, proxy, equal, notEqual, isTrue, isFalse, isTruthy, isNotTruthy*/

/* 
 *This script uses BDD-like semantics. If you prefer TDD 
 *semantics, then please see javascripts\sample-test.js.
 */ 

configure({
    name: 'Sample Test Suite (BDD-Like)',
    hidePassedTests: true,
    hideAssertions: true
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
    then('beforeEach is called', function(){
        equal(count, 100, 'before tests are called');
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
            equal(count, 100, 'before asynchronous tests are called ');
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

when('snooping on a method', function(){
    beforeEach(function(val){
        val.foo = {
            someFn: function(arg){
                return arg;
            }
        };
    });
    then('we can query if the method was called', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled(), 'it was called');
    });
    then('we can query how many times the method was called', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.called(), 1, 'returns the number of times method was called');
    });
    then('we can query the method was called n times', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled.nTimes(1), 'return true if called n times');
        isFalse(foo.someFn.wasCalled.nTimes(2), 'return false if not called n times');
    });
    then('we can query the context the method was called with', function(val){
        var foo = val.foo,
            bar = {};
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.contextCalledWith(), foo, 'was called with foo');
        notEqual(foo.someFn.contextCalledWith(), bar, 'was not called with bar');
    });
    then('we can query for the arguments that the method was called with', function(val){
        var foo = val.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.args.getArgument(0), arg, 'was Preamble rocks!');
        notEqual(foo.someFn.args.getArgument(0), arg + '!', 'was not Preamble rocks!!');
        isNotTruthy(foo.someFn.args.getArgument(1), 'asking for an argument that was not passed');
    });
    then('we can query for what the method returned', function(val){
        var foo = val.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.returned(), arg, 'returned arg');
        notEqual(foo.someFn.returned(), arg + '!', 'did not return arg + "!"');
    });
});

when('a snooped method throws', function(){
    beforeEach(function(val){
        val.foo = {
            someFn: function(){
                throw new Error('Holy Batman!');
            }
        };
    });
    then('we can query the method if threw', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.threw(), 'it did throw');
        isTrue(foo.someFn.threw.withMessage('Holy Batman!'), 'with message');
        isFalse(foo.someFn.threw.withMessage('Holy Batman!!'), 'not with message');
    });
});

when('snooping on more than one method', function(){
    beforeEach(function(val){
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

    then('snoops are isolated and there are no side effects', function(val){
        var foo = val.foo,
            bar = val.bar;
        snoop(foo, 'someFn');
        snoop(bar, 'someFn');
        foo.someFn('Is Preamble great?');
        bar.someFn('Yes it is!');
        foo.someFn('You got that right!');
        isTrue(foo.someFn.wasCalled(), 'foo.someFn was called');
        isTrue(foo.someFn.wasCalled.nTimes(2), 'foo.someFn was called n times');
        isFalse(foo.someFn.wasCalled.nTimes(1), 'foo.someFn was not called n times');
        isTrue(bar.someFn.wasCalled(), 'bar.someFn was called');
        isTrue(bar.someFn.wasCalled.nTimes(1), 'bar.someFn was called n times');
        isFalse(bar.someFn.wasCalled.nTimes(2), 'bar.someFn was not called n times');
    });
});

when('the calls api is used', function(){
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
    then('count() returns the right count', function(){
        equal(foo.someFn.calls.count(), n, 'count is correct');
    });
    then('all() returns an array with the right number of elements', function(){
        equal(foo.someFn.calls.all().length, n, 'all returns 10 elements');
    });
    then('forCall(n) returns the correct element', function(){
        for(i = 0; i < n; i++){
            aCall = foo.someFn.calls.forCall(i);
            equal(aCall.context, foo, 'context is foo');
            notEqual(aCall.context, bar, 'context is bar');
            equal(aCall.args[0], i, 'args[0] is ' + i);
            notEqual(aCall.args[0], n, 'args[0] is ' + n);
            isNotTruthy(aCall.error, 'there was no error');
            equal(aCall.returned, i, 'returned ' + i);
            notEqual(aCall.returned, n, 'returned ' + n);
        }
    });
});

