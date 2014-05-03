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
        isTrue(hw === 'Hello World!');
    });
    then('if it fails', function(){
        isTrue(false);
    });
});

when('Evaluating boolean assertions', function(){
    then('bollean true', function(){
        isTrue(true);
    });
    then('boolean false', function(){
        isFalse(false);
    });
});

when('Evaluating truthy assertions', function(){
    then('undefined', function(){
        var undef;
        isNotTruthy(undef);
    });
    then('objects', function(){
        var def = {};
        isTruthy(def);
    });
    then('numeric values other than 0', function(){
        var one = 1;
        isTruthy(one);
    });
    then('numeric vaules that are 0', function(){
        var zero = 0;
        isNotTruthy(zero);
    });
    then('non empty strings', function(){
        isTruthy('not empty string');
    });
    then('empty strings', function(){
        isNotTruthy('');
    });
});

when('Evaluating strict, deep recursive comparison assertions', function(){
    var char = 'b';
    var a = {a: 'a', b: 'b'};
    var b = {a: 'a', b: b};
    var c = {a: 'a', b: 'b'};
    then('2 objects with exactly the same properties and property values', function(){
        equal(a, c);
    });
    then('2 objects with different properties or property values', function(){
        notEqual(a, b);
    });
    then('2 value types whose values are the same', function(){
        equal(char, 'b');
    });
    then('2 value types whose values are  not the same', function(){
        notEqual(char, 'a');
    });
});

when('Running synchronous tests with beforeEach', function(){
    var count = 0;
    beforeEach(function(){
        count = 100;
    });
    then('beforeEach is called', function(){
        equal(count, 100);
    });
});

when('Passing a value from beforeEach to tests', function(){
    beforeEach(function(valObj){
        valObj.value = 10;
    });
    then('the tests', function(valObj){
        equal(valObj.value, 10);
    });
});

when('Running synchronous tests with afterEachTest', function(){
    var count = 0;
    afterEach(function(){
        count = 100;
    });
    then('the first test', function(){
        equal(count, 0);
    });
    then('but subsequent tests', function(){
        equal(count, 100);
    });
});

when('Running asynchronous tests', function(){
    var count = 0;
    thenAsync('calling whenDone', 1, function(){
        setTimeout(function(){
            count = 100;
        }, 1);
        whenDone(function(){
            equal(count, 100);
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
            equal(count, 100);
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
            equal(valObj.value, 10);
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
            isTrue(count === 10);
        });
    });
    thenAsync('but subsequent asynchronous tests', 1, function(){
        setTimeout(function(){
            count *= 100;
        }, 1);
        whenDone(function(){
            isTrue(count === 100);
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
        isTrue(val.fn.wasCalled(1));
        isFalse(val.fn.wasCalled(2));
    });
    then('calling getCalledCount() on that function', function(val){
        equal(val.fn.getCalledCount(), 1);
    });
    then('calling getData(n) on that function', function(val){
        var info = val.fn.getData(0);
        notEqual(info, undefined);
    });
    then('and the object that getData(n) returns exposes and api', function(val){
        var info = val.fn.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript');
        equal(info.returned, 'JavaScript is amazing!');
        equal(info.context, undefined);
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
        isTrue(val.someObject.someMethod.wasCalled(1));
        isFalse(val.someObject.someMethod.wasCalled(2));
    });
    then('calling getCalledCount() on that method', function(val){
        equal(val.someObject.someMethod.getCalledCount(), 1);
    });
    then('calling getData(n) on that method', function(val){
        var info = val.someObject.someMethod.getData(0);
        notEqual(info, undefined);
    });
    then('and the object that getData(n) returns exposes and api', function(val){
        var info = val.someObject.someMethod.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript');
        equal(info.returned, 'JavaScript is amazing!');
        equal(info.context, val.someObject);
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
        isTrue(foo.someFn.wasCalled());
    });
    then('we can query how many times the method was called', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.called(), 1);
    });
    then('we can query the method was called n times', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled.nTimes(1));
        isFalse(foo.someFn.wasCalled.nTimes(2));
    });
    then('we can query the context the method was called with', function(val){
        var foo = val.foo,
            bar = {};
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.contextCalledWith(), foo);
        notEqual(foo.someFn.contextCalledWith(), bar);
    });
    then('we can query for the arguments that the method was called with', function(val){
        var foo = val.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.args.getArgument(0), arg);
        notEqual(foo.someFn.args.getArgument(0), arg + '!');
        isNotTruthy(foo.someFn.args.getArgument(1));
    });
    then('we can query for what the method returned', function(val){
        var foo = val.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.returned(), arg);
        notEqual(foo.someFn.returned(), arg + '!');
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
        isTrue(foo.someFn.threw());
        isTrue(foo.someFn.threw.withMessage('Holy Batman!'));
        isFalse(foo.someFn.threw.withMessage('Holy Batman!!'));
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
        isTrue(foo.someFn.wasCalled());
        isTrue(foo.someFn.wasCalled.nTimes(2));
        isFalse(foo.someFn.wasCalled.nTimes(1));
        isTrue(bar.someFn.wasCalled());
        isTrue(bar.someFn.wasCalled.nTimes(1));
        isFalse(bar.someFn.wasCalled.nTimes(2));
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
        equal(foo.someFn.calls.count(), n);
    });
    then('all() returns an array with the right number of elements', function(){
        equal(foo.someFn.calls.all().length, n);
    });
    then('forCall(n) returns the correct element', function(){
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

