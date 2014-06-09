/*jslint eqeq: true*/
/*jshint strict: false*/
/*global configure, describe, beforeEach, afterEach, it, -getUiTestContainerElement, -getUiTestContainerElementId, snoop, proxy, equal, notEqual, isTrue, isFalse, isTruthy, isNotTruthy*/

/* 
 *This script uses BDD-like semantics. If you prefer TDD 
 *semantics, then please see javascripts\sample-test.js.
 */ 

configure({
    name: 'Sample Test Suite (BDD-Like)',
    hidePassedTests: true,
    //hideAssertions: true,
    asyncTestDelay: 500
});

describe('A nested test fails', function(){
    it('a passing test looks like this', function(){
        equal(1, 1);
    });
    describe('and all parent groups are marked as having failed', function(){
        it('even if they contain passing tests as this one', function(){
            equal(1,1);
        });
        describe('it is nested', function(){
            it('it looks like this', function(){
                equal(1, 0);
            });
        });
    });
});

describe('1', function(){
    describe('2', function(){
        it('2.1',function(){
            isTrue(true);
        });
    });
    it('1.1', function(){
        isTrue(true);
    });
});

describe('A long running asynchronous before process that fails to complete on time', function(){
    beforeEach(function(done){
        var self = this;
        setTimeout(function(){
            self.count = 100;
            done();
        }, 1000);
    });
    it('will time out and the test will be marked as having failed', function(){
        equal(this.count, 100);
    });
});

describe('A test can configure long running asynchronous before processes not to time out and fail', function(){
    beforeEach(function(done){
        var self = this;
        setTimeout(function(){
            self.count = 100;
            done();
        }, 1000);
    });
    it('by passing a time out interval', 1010, function(){
        equal(this.count, 100);
    });
});

describe('A long running asynchronous after process that fails to complete on time', function(){
    beforeEach(function(){
        this.count = 100;
    });
    afterEach(function(done){
        setTimeout(function(){
            done();
        }, 1000);
    });
    it('will time out and the test will be marked as having failed', function(){
        equal(this.count, 100);
    });
    it('count should still be 100', function(){
        equal(this.count, 100);
    });
});

describe('A test can configure long running asynchronous after processes not to time out and fail', function(){
    beforeEach(function(){
        this.count = 100;
    });
    afterEach(function(done){
        setTimeout(function(){
            done();
        }, 1000);
    });
    it('by passing a time out interval', 1010, function(){
        equal(this.count, 100);
    });
    it('count should be reset to 100', 1010, function(){
        equal(this.count, 100);
    });
});

/**
 * This test will take 1000 miliseconds to run but the test will
 * time out and fail because asyncTestDelay is set above to 500. 
 */
describe('A long running test that fails to complete on time', function(){
    var count = 0;
    it('will time out and marked as having failed', function(done){
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
describe('A long running test can change how long its timeout interval is', function(){
    var count = 0;
    it('so it will not time out and fail.', 1010, function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1000);
    });
});

describe('A simple test', function(){
    it('of equality', function(){
        equal(1,1);
    });
});

describe('Nested specs', function(){
    beforeEach(function(){
        this.value = 10;
    });
    afterEach(function(){
        this.isCrazy = true;
    });
    describe('Nested spec 1', function(){
        it('nested spec 1: test 1', function(){
            equal(this.value, 10);
        });
        it('isCrazy is true', function(){
            isTrue(typeof(this.isCrazy) === 'undefined');
        });
    });
    describe('Nested spec 2', function(){
        beforeEach(function(){
            this.foo = 'bar';
        });
        afterEach(function(){
            this.xx = 'xx';
        });
        it('nested spec 2: test 1', function(){
            equal(this.value, 10);
            equal(this.foo, 'bar');
        });
        it('nested spec 2: test 2', function(){
            equal(this.value, 10);
            equal(this.foo, 'bar');
            isTrue(typeof(this.xx) === 'undefined');
        });
        describe('Nested spec 3', function(){
            beforeEach(function(){
                this.flim = 'flam';
            });
            it('nested spec 3: test 1', function(){
                equal(this.value, 10);
                equal(this.foo, 'bar');
                equal(this.flim, 'flam');
            });
        });
    });
});

describe('Running a test', function(){
    it('and it passes it looks like this', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!');
    });
    it('and if it fails it looks like this', function(){
        isTrue(false);
    });
});

describe('Evaluating boolean assertions', function(){
    it('bollean true', function(){
        isTrue(true);
    });
    it('boolean false', function(){
        isFalse(false);
    });
});

describe('Evaluating truthy assertions', function(){
    it('undefined', function(){
        var undef;
        isNotTruthy(undef);
    });
    it('objects', function(){
        var def = {};
        isTruthy(def);
    });
    it('numeric values other than 0', function(){
        var one = 1;
        isTruthy(one);
    });
    it('numeric vaules that are 0', function(){
        var zero = 0;
        isNotTruthy(zero);
    });
    it('non empty strings', function(){
        isTruthy('not empty string');
    });
    it('empty strings', function(){
        isNotTruthy('');
    });
});

describe('Evaluating strict, deep recursive comparison assertions', function(){
    var char = 'b';
    var a = {a: 'a', b: 'b'};
    var b = {a: 'a', b: b};
    var c = {a: 'a', b: 'b'};
    it('2 objects with exactly the same properties and property values', function(){
        equal(a, c);
    });
    it('2 objects with different properties or property values', function(){
        notEqual(a, b);
    });
    it('2 value types whose values are the same', function(){
        equal(char, 'b');
    });
    it('2 value types whose values are  not the same', function(){
        notEqual(char, 'a');
    });
});

describe('Running synchronous tests with beforeEach', function(){
    var count = 0;
    beforeEach(function(){
        count = 100;
    });
    it('beforeEach is called', function(){
        equal(count, 100);
    });
});

describe('Passing a value from beforeEach to tests', function(){
    beforeEach(function(){
        this.value = 10;
    });
    it('the tests', function(){
        equal(this.value, 10);
    });
});

describe('Running synchronous tests with afterEachTest', function(){
    var count = 0;
    afterEach(function(){
        count = 100;
    });
    it('the first test', function(){
        equal(count, 0);
    });
    it('but subsequent tests', function(){
        equal(count, 100);
    });
});

describe('Running asynchronous tests', function(){
    var count = 0;
    it('calling whenDone', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1);
    });
});

describe('Running asynchronous tests with beforeEachAsync', function(){
    var count = 0;
    beforeEach(function(done){
        setTimeout(function(){
            count = 10;
            done();
        }, 1);
    });
    it('beforeEachAsync is called', function(done){
        setTimeout(function(){
            count *= 10;
            done(function(){
                equal(count, 100);
            });
        }, 1);
    });
});

describe('Passing a value from beforeEachAsync to asynchronous tests', function(){
    beforeEach(function(done){
        var self = this;
        setTimeout(function(){
            self.value = 10;
            done();
        }, 1);
    });
    it('the asynchronous tests', function(done){
        setTimeout(function(){
            //some asynchronous process...
            done(function(){
                equal(this.value, 10);
            });
        }, 1);
    });
});

describe('Running asynchronous tests with afterEachAsync', function(){
    var count = 0;
    afterEach(function(done){
        setTimeout(function(){
            count = 1;
            done();
        }, 1);
    });
    it('the first asynchronous test', function(done){
        setTimeout(function(){
            count = 10;
            done(function(){
                isTrue(count === 10);
            });
        }, 1);
    });
    it('but subsequent asynchronous tests', function(done){
        setTimeout(function(){
            count *= 100;
            done(function(){
                isTrue(count === 100);
            });
        }, 1);
    });
});

describe('Proxy wraps a function and that function is called', function(){
    beforeEach(function(){
        var fn = proxy(function(){
            return 'JavaScript is amazing!';
        });
        fn('Tell me something about JavaScript');
        this.fn = fn;
    });
    it('calling wasCalled(number) on that function', function(){
        isTrue(this.fn.wasCalled(1));
        isFalse(this.fn.wasCalled(2));
    });
    it('calling getCalledCount() on that function', function(){
        equal(this.fn.getCalledCount(), 1);
    });
    it('calling getData(n) on that function', function(){
        var info = this.fn.getData(0);
        notEqual(info, undefined);
    });
    it('and the object that getData(n) returns exposes and api', function(){
        var info = this.fn.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript');
        equal(info.returned, 'JavaScript is amazing!');
        equal(info.context, undefined);
    });
});

describe('Proxy wraps a method and that function is called', function(){
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
    it('calling wasCalled(number) on that method', function(){
        isTrue(this.someObject.someMethod.wasCalled(1));
        isFalse(this.someObject.someMethod.wasCalled(2));
    });
    it('calling getCalledCount() on that method', function(){
        equal(this.someObject.someMethod.getCalledCount(), 1);
    });
    it('calling getData(n) on that method', function(){
        var info = this.someObject.someMethod.getData(0);
        notEqual(info, undefined);
    });
    it('and the object that getData(n) returns exposes and api', function(){
        var info = this.someObject.someMethod.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript');
        equal(info.returned, 'JavaScript is amazing!');
        equal(info.context, this.someObject);
    });
});

describe('snooping on a method', function(){
    beforeEach(function(){
        this.foo = {
            someFn: function(arg){
                return arg;
            }
        };
    });
    it('we can query if the method was called', function(){
        var foo = this.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled());
    });
    it('we can query how many times the method was called', function(){
        var foo = this.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.called(), 1);
    });
    it('we can query the method was called n times', function(){
        var foo = this.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled.nTimes(1));
        isFalse(foo.someFn.wasCalled.nTimes(2));
    });
    it('we can query the context the method was called with', function(){
        var foo = this.foo,
            bar = {};
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.contextCalledWith(), foo);
        notEqual(foo.someFn.contextCalledWith(), bar);
    });
    it('we can query for the arguments that the method was called with', function(){
        var foo = this.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.args.getArgument(0), arg);
        notEqual(foo.someFn.args.getArgument(0), arg + '!');
        isNotTruthy(foo.someFn.args.getArgument(1));
    });
    it('we can query for what the method returned', function(){
        var foo = this.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.returned(), arg);
        notEqual(foo.someFn.returned(), arg + '!');
    });
});

describe('a snooped method throws', function(){
    beforeEach(function(){
        this.foo = {
            someFn: function(){
                throw new Error('Holy Batman!');
            }
        };
    });
    it('we can query the method if threw', function(){
        var foo = this.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.threw());
        isTrue(foo.someFn.threw.withMessage('Holy Batman!'));
        isFalse(foo.someFn.threw.withMessage('Holy Batman!!'));
    });
});

describe('snooping on more than one method', function(){
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

    it('snoops are isolated and there are no side effects', function(){
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

describe('using snoop\'s "calls" api', function(){
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
    it('count() returns the right count', function(){
        equal(foo.someFn.calls.count(), n);
    });
    it('all() returns an array with the right number of elements', function(){
        equal(foo.someFn.calls.all().length, n);
    });
    it('forCall(n) returns the correct element', function(){
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

