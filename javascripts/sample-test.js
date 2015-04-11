/*jslint eqeq: true*/
/*jshint strict: false*/
/*global configure, describe, beforeEach, afterEach, it, -getUiTestContainerElement, -getUiTestContainerElementId, snoop, expect, toEqual, toNotEqual, toBeTrue, toBeFalse, toBeTruthy, toNotBeTruthy, equal, notEqual, isTrue, isFalse, isTruthy, isNotTruthy*/

/**
 * inline configuration
 */
configure({
    name: 'Sample Test Suite',
    hidePassedTests: true,
    testTimeOutInterval: 500
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

describe('using snoop\'s "calls" api with methods', function(){
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

/**
 *v2.3.0 support snooping on standalone functions
 */
describe('snooping on a function', function(){
    beforeEach(function(){
        this.someFn = function(arg){
                return arg;
        };
    });
    it('we can query if the function was called', function(){
        var someFn = this.someFn,
            snoopedFn = snoop(someFn);
        snoopedFn();
        isTrue(snoopedFn.wasCalled());
    });
    it('we can query how many times the method was called', function(){
        var someFn = this.someFn,
            snoopedFn = snoop(someFn);
        snoopedFn();
        equal(snoopedFn.called(), 1);
    });
    it('we can query the function was called n times', function(){
        var someFn = this.someFn,
            snoopedFn = snoop(someFn);
        snoopedFn();
        isTrue(snoopedFn.wasCalled.nTimes(1));
        isFalse(snoopedFn.wasCalled.nTimes(2));
    });
    it('we can query the context the function was called with', function(){
        var someFn = this.someFn,
            bar = {},
            snoopedFn = snoop(someFn, bar);
        snoopedFn();
        equal(snoopedFn.contextCalledWith(), bar);
    });
    it('we can query for the arguments that the function was called with', function(){
        var someFn = this.someFn,
            snoopedFn = snoop(someFn),
            arg = 'Preamble rocks!';
        snoopedFn(arg);
        equal(snoopedFn.args.getArgument(0), arg);
        notEqual(snoopedFn.args.getArgument(0), arg + '!');
        isNotTruthy(snoopedFn.args.getArgument(1));
    });
    it('we can query for what the function returned', function(){
        var someFn = this.someFn,
            snoopedFn = snoop(someFn),
            arg = 'Preamble rocks!';
        snoopedFn(arg);
        equal(snoopedFn.returned(), arg);
        notEqual(snoopedFn.returned(), arg + '!');
    });
});

describe('a snooped function throws', function(){
    beforeEach(function(){
        this.someFn = function(){
            throw new Error('Holy Batman!');
        };
    });
    it('we can query the function if threw', function(){
        var someFn = this.someFn,
            snoopedFn = snoop(someFn);
        snoopedFn();
        isTrue(snoopedFn.threw());
        isTrue(snoopedFn.threw.withMessage('Holy Batman!'));
        isFalse(snoopedFn.threw.withMessage('Holy Batman!!'));
    });
});

describe('snooping on more than one function', function(){
    beforeEach(function(){
        this.fooFn = function(arg){
            return arg;
        };
        this.barFn = function(arg){
            return arg;
        };
    });

    it('snoops are isolated and there are no side effects', function(){
        var fooFn = this.fooFn,
            barFn = this.barFn,
            snoopedFooFn = snoop(fooFn),
            snoopedBarFn = snoop(barFn);
        snoopedFooFn('Is Preamble great?');
        snoopedBarFn('Yes it is!');
        snoopedFooFn('You got that right!');
        isTrue(snoopedFooFn.wasCalled());
        isTrue(snoopedFooFn.wasCalled.nTimes(2));
        isFalse(snoopedFooFn.wasCalled.nTimes(1));
        isTrue(snoopedBarFn.wasCalled());
        isTrue(snoopedBarFn.wasCalled.nTimes(1));
        isFalse(snoopedBarFn.wasCalled.nTimes(2));
    });
});

describe('using snoop\'s "calls" api with functions', function(){
    var i,
        foo = function(arg){
            return arg;
        },
        bar ={},
        n = 3,
        aCall,
        snoopedFooFn = snoop(foo, bar);
    for(i = 0; i < n; i++){
        snoopedFooFn(i) ;
    }
    it('count() returns the right count', function(){
        equal(snoopedFooFn.calls.count(), n);
    });
    it('all() returns an array with the right number of elements', function(){
        equal(snoopedFooFn.calls.all().length, n);
    });
    it('forCall(n) returns the correct element', function(){
        for(i = 0; i < n; i++){
            aCall = snoopedFooFn.calls.forCall(i);
            equal(aCall.context, bar);
            equal(aCall.args[0], i);
            notEqual(aCall.args[0], n);
            isNotTruthy(aCall.error);
            equal(aCall.returned, i);
            notEqual(aCall.returned, n);
        }
    });
});

/**
 * v2.3.0 expect().assertion() syntax
 */
 describe('when using expect', function(){
    it('toEqual will pass when true', function(){
        expect(1).toEqual(1);
    });
    it('toEqual will fail when false', function(){
        expect(1).toNotEqual(2);
    });
    it('toBeTrue will pass when true', function(){
        expect(1 === 1).toBeTrue();
        });
    it('toBeFalse will pass when false', function(){
        expect(1 === 2).toBeFalse();
    });
 });

describe('BDD Evaluating truthy assertions', function(){
    it('undefined', function(){
        var undef;
        expect(undef).toNotBeTruthy();
    });
    it('objects', function(){
        var def = {};
        expect(def).toBeTruthy();
    });
    it('numeric values other than 0', function(){
        var one = 1;
        expect(one).toBeTruthy();
    });
    it('numeric vaules that are 0', function(){
        var zero = 0;
        expect(zero).toNotBeTruthy();
    });
    it('non empty strings', function(){
        expect('not empty string').toBeTruthy();
    });
    it('empty strings', function(){
        expect('').toNotBeTruthy();
    });
});
