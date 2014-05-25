/*jslint eqeq: true*/
/*jshint strict: false*/
/*global configure, when, beforeEach, afterEach, then, -getUiTestContainerElement, -getUiTestContainerElementId, snoop, proxy, equal, notEqual, isTrue, isFalse, isTruthy, isNotTruthy*/

/* 
 *This script uses BDD-like semantics. If you prefer TDD 
 *semantics, then please see javascripts\sample-test.js.
 */ 

configure({
    name: 'Sample Test Suite (BDD-Like)',
    hidePassedTests: true,
    hideAssertions: true,
    asyncTestDelay: 500
});

/**
 * This test will take 1000 miliseconds to run but the test will
 * time out and fail because asyncTestDelay is set above to 500. 
 */
when('A long running test that fails to complete on time', function(){
    var count = 0;
    then('will time out and marked as having failed', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1000);
    });
});

/**
 * This is the same test as above but here the tests sets its
 * time out interval to 1010 miliseconds to prevent it from 
 * timing out and failing.
 * This is a very good way to fine tune individual test but...
 * IMPORTANT: you can override asyncTestDelay in your in-line
 * configuration or in your configuration file and it will
 * apply to all tests.
 */
when('A long running test can change how long its timeout interval is', function(){
    var count = 0;
    then('so it will not time out and fail.', 1010, function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1000);
    });
});

when('A simple test', function(){
    then('of equality', function(){
        equal(1,1);
    });
});

when('Nested specs', function(){
    beforeEach(function(){
        this.value = 10;
    });
    afterEach(function(){
        this.isCrazy = true;
    });
    when('Nested spec 1', function(){
        then('nested spec 1: test 1', function(){
            equal(this.value, 10);
        });
        then('isCrazy is true', function(){
            isTrue(typeof(this.isCrazy) === 'undefined');
        })
    });
    when('Nested spec 2', function(){
        beforeEach(function(){
            this.foo = 'bar';
        });
        afterEach(function(){
            this.xx = 'xx';
        });
        then('nested spec 2: test 1', function(){
            equal(this.value, 10);
            equal(this.foo, 'bar');
        });
        then('nested spec 2: test 2', function(){
            equal(this.value, 10);
            equal(this.foo, 'bar');
            isTrue(typeof(this.xx) === 'undefined');
        });
        when('Nested spec 3', function(){
            beforeEach(function(){
                this.flim = 'flam';
            });
            then('nested spec 3: test 1', function(){
                equal(this.value, 10);
                equal(this.foo, 'bar');
                equal(this.flim, 'flam');
            });
        });
    });
});

when('Running a test', function(){
    then('and it passes it looks like this', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!');
    });
    then('and if it fails it looks like this', function(){
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
    beforeEach(function(){
        this.value = 10;
    });
    then('the tests', function(){
        equal(this.value, 10);
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
    then('calling whenDone', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1);
    });
});

when('Running asynchronous tests with beforeEachAsync', function(){
    var count = 0;
    beforeEach(function(done){
        setTimeout(function(){
            count = 10;
            done();
        }, 1);
    });
    then('beforeEachAsync is called', function(done){
        setTimeout(function(){
            count *= 10;
            done(function(){
                equal(count, 100);
            });
        }, 1);
    });
});

when('Passing a value from beforeEachAsync to asynchronous tests', function(){
    beforeEach(function(done){
        var self = this;
        setTimeout(function(){
            self.value = 10;
            done();
        }, 1);
    });
    then('the asynchronous tests', function(done){
        setTimeout(function(){
            //some asynchronous process...
            done(function(){
                equal(this.value, 10);
            });
        }, 1);
    });
});

when('Running asynchronous tests with afterEachAsync', function(){
    var count = 0;
    afterEach(function(done){
        setTimeout(function(){
            count = 1;
            done();
        }, 1);
    });
    then('the first asynchronous test', function(done){
        setTimeout(function(){
            count = 10;
            done(function(){
                isTrue(count === 10);
            });
        }, 1);
    });
    then('but subsequent asynchronous tests', function(done){
        setTimeout(function(){
            count *= 100;
            done(function(){
                isTrue(count === 100);
            });
        }, 1);
    });
});

when('Proxy wraps a function and that function is called', function(){
    beforeEach(function(){
        var fn = proxy(function(){
            return 'JavaScript is amazing!';
        });
        fn('Tell me something about JavaScript');
        this.fn = fn;
    });
    then('calling wasCalled(number) on that function', function(){
        isTrue(this.fn.wasCalled(1));
        isFalse(this.fn.wasCalled(2));
    });
    then('calling getCalledCount() on that function', function(){
        equal(this.fn.getCalledCount(), 1);
    });
    then('calling getData(n) on that function', function(){
        var info = this.fn.getData(0);
        notEqual(info, undefined);
    });
    then('and the object that getData(n) returns exposes and api', function(){
        var info = this.fn.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript');
        equal(info.returned, 'JavaScript is amazing!');
        equal(info.context, undefined);
    });
});

when('Proxy wraps a method and that function is called', function(){
    beforeEach(function(){
        var someObject = {
            someMethod: function(){
                return 'JavaScript is amazing!';
            }
        };
        proxy(someObject, 'someMethod');
        someObject.someMethod('Tell me something about JavaScript');
        this.someObject = someObject;
    });
    then('calling wasCalled(number) on that method', function(){
        isTrue(this.someObject.someMethod.wasCalled(1));
        isFalse(this.someObject.someMethod.wasCalled(2));
    });
    then('calling getCalledCount() on that method', function(){
        equal(this.someObject.someMethod.getCalledCount(), 1);
    });
    then('calling getData(n) on that method', function(){
        var info = this.someObject.someMethod.getData(0);
        notEqual(info, undefined);
    });
    then('and the object that getData(n) returns exposes and api', function(){
        var info = this.someObject.someMethod.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript');
        equal(info.returned, 'JavaScript is amazing!');
        equal(info.context, this.someObject);
    });
});

when('snooping on a method', function(){
    beforeEach(function(){
        this.foo = {
            someFn: function(arg){
                return arg;
            }
        };
    });
    then('we can query if the method was called', function(){
        var foo = this.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled());
    });
    then('we can query how many times the method was called', function(){
        var foo = this.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.called(), 1);
    });
    then('we can query the method was called n times', function(){
        var foo = this.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled.nTimes(1));
        isFalse(foo.someFn.wasCalled.nTimes(2));
    });
    then('we can query the context the method was called with', function(){
        var foo = this.foo,
            bar = {};
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.contextCalledWith(), foo);
        notEqual(foo.someFn.contextCalledWith(), bar);
    });
    then('we can query for the arguments that the method was called with', function(){
        var foo = this.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.args.getArgument(0), arg);
        notEqual(foo.someFn.args.getArgument(0), arg + '!');
        isNotTruthy(foo.someFn.args.getArgument(1));
    });
    then('we can query for what the method returned', function(){
        var foo = this.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.returned(), arg);
        notEqual(foo.someFn.returned(), arg + '!');
    });
});

when('a snooped method throws', function(){
    beforeEach(function(){
        this.foo = {
            someFn: function(){
                throw new Error('Holy Batman!');
            }
        };
    });
    then('we can query the method if threw', function(){
        var foo = this.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.threw());
        isTrue(foo.someFn.threw.withMessage('Holy Batman!'));
        isFalse(foo.someFn.threw.withMessage('Holy Batman!!'));
    });
});

when('snooping on more than one method', function(){
    beforeEach(function(){
        this.foo = {
            someFn: function(arg){
                return arg;
            }
        };
        this.bar = {
            someFn: function(arg){
                return arg;
            }
        };
    });

    then('snoops are isolated and there are no side effects', function(){
        var foo = this.foo,
            bar = this.bar;
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

when('using snoop\'s "calls" api', function(){
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

