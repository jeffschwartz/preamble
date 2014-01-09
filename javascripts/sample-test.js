group('Does it work?', function(){
    test('Hello World!', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!', 'Yes, it works!');
    });
});

group('Truthy boolean evaluation', function(){
    var undef;
    var def = {};
    var one = 1;
    var fls = false;
    var tru = true;
    test('When using truthy boolean evaluation', function(){
        isNotTruthy(undef, 'undefined is false');
        isTruthy(def, 'a valid reference is true');
        isTruthy(one, '1 is true');
        isNotTruthy(fls, 'false is false');
        isTruthy(tru, 'true is true');
    });
});

group('Assertions', function(){
    test('Does a equal b', function(){
        var char = 'b';
        var a = {a: 'a', b: 'b'};
        var b = {a: 'a', b: b};
        var c = {a: 'a', b: 'b'};
        var three = 3;
        notEqual(a, b, 'No way these are equal.');
        equal(a, c, 'But these are equal.');
        equal(char, 'b', 'Yup, these are equal too.');
        equal(3, three, 'And so are these.');
    });
});

group('2 synchronous test with "beforeEachTest"', function(){
    var count = 0;
    beforeEachTest(function(){
        count = 1;
    });
    test('Is count 1?', function(){
        isFalse(count === 0, 'count doesn\'t equal 0');
        isTrue(count === 1, 'count does equal 1');
        isTrue((count += 1) === 2, 'count now equals 2');
    });
    test('Is count still 2?', function(){
        isFalse(count === 2, 'nope, it isn\'t still 2');
        isTrue(count === 1, 'now count equals 1');
    });
});

group('2 synchronous test with "afterEachTest"', function(){
    var count = 0;
    afterEachTest(function(){
        count = 1;
    });
    test('Is count 0?', function(){
        isTrue(count === 0, 'count does equal 0.');
    });
    test('Is count still 0?', function(){
        isFalse(count === 0, 'count doesn\'t equal 0.');
        isTrue(count === 1, 'count now equals 1.');
    });
});

group('An asynchronous test with no before/after eachTest', function(){
    asyncTest('Isn\'t JavaScript amazing?', function(){
        var val;
        setTimeout(function(){
            val = 'Isn\'t JavaScript amazing?';
        }, 10);
        whenAsyncDone(function(){
            isTrue(val === 'Isn\'t JavaScript amazing?', 'Yest it is!');
        });
    });
});

group('An asynchronous test that demonstrates using "proxy" - 1', function(){
    asyncTest('proxy(callback) can tell you a lot abut a callback', function(){
        var callback = proxy(function(s){
            return s;
        });
        setTimeout(function(){
            callback('Somewhere over');
            callback('the rainbow');
        }, 10);
        whenAsyncDone(function(){
            isTrue(callback.wasCalled(), 'callback was called.');
            equal(callback.getCalledCount(), 2, 'callback was called once.');
            isTrue(callback.getArgsPassed(0, 0) === 'Somewhere over', 'callback was passed "Somewhere over"');
            isTrue(callback.getArgsPassed(1, 0) === 'the rainbow', 'callback was passed "the rainbow"');
            isTrue(callback.getReturned(0) === 'Somewhere over', 'callback returned "Somewhere over"');
            isTrue(callback.getReturned(1) === 'the rainbow', 'callback returned "the rainbow"');
            isTrue(callback.getContexts(0) === undefined, 'the 1st time callback was called with global context');
            isTrue(callback.getContexts(1) === undefined, 'the 2nd time callback was called with global context');
        });
    });
});

group('An asynchronous test that demonstrates using "proxy" - 2', function(){
    asyncTest('proxy(callback) can tell you a lot abut a callback', function(){
        var callback1 = proxy(function(s){
            return s;
        });
        var callback2 = proxy(function(s){
            return s;
        });
        setTimeout(function(){
            callback1('Somewhere over');
            callback2('the rainbow');
        }, 10);
        whenAsyncDone(function(){
            isTrue(callback1.wasCalled(), 'callback1 was called.');
            equal(callback1.getCalledCount(), 1, 'callback1 was called once.');
            isTrue(callback2.wasCalled(), 'callback2 was called.');
            equal(callback2.getCalledCount(), 1, 'callback2 was called once.');
            isTrue(callback1.getArgsPassed(0, 0) === 'Somewhere over', 'callback1 was passed "Somewhere over"');
            isTrue(callback2.getArgsPassed(0, 0) === 'the rainbow', 'callback2 was passed "the rainbow"');
            isTrue(callback1.getReturned(0) === 'Somewhere over', 'callback1 returned "Somewhere over"');
            isTrue(callback2.getReturned(0) === 'the rainbow', 'callback2 returned "the rainbow"');
        });
    });
});

group('An asynchronous test that demonstrates using "proxy" - 3', function(){
    asyncTest('proxy(callback) can tell you a lot abut a callback', function(){
        var foo = {
            title: '',
            name: proxy(function(s){this.title += s; return s;})
        };
        var callback = proxy(foo, 'name');
        setTimeout(function(){
            foo.name('Somewhere over ');
            foo.name('the rainbow');
        }, 10);
        whenAsyncDone(function(){
            equal(foo.title, 'Somewhere over the rainbow', 'foo.title = "Somewhere over the rainbow"');
            isTrue(foo.name.wasCalled(), 'callback was called.');
            equal(foo.name.getCalledCount(), 2, 'callback was called once.');
            isTrue(foo.name.getArgsPassed(0, 0) === 'Somewhere over ', 'callback was passed "Somewhere over"');
            isTrue(foo.name.getArgsPassed(1, 0) === 'the rainbow', 'callback was passed "the rainbow"');
            isTrue(foo.name.getReturned(0) === 'Somewhere over ', 'callback returned "Somewhere over "');
            isTrue(foo.name.getReturned(1) === 'the rainbow', 'callback returned "the rainbow"');
            isTrue(foo.name.getContexts(0) === foo, 'the 1st time callback was called with foo\'s context');
            isTrue(foo.name.getContexts(1) === foo, 'the 2nd time callback was called with foo\'s context');
        });
    });
});

group('2 asynchronous tests with "asyncBeforeEachTest"', function(){
    var count = 0;
    asyncBeforeEachTest(function(){
        count = 1;
    });
    asyncTest('Is count 1?', function(){
        setTimeout(function(){
            isFalse(count === 0, 'count doesn\'t equal 0 anymore');
            isTrue(count === 1, 'count equals 1.');
            count *= 10;
        }, 10);

        whenAsyncDone(function(){
            isFalse(count === 0, 'count doesn\'t equal 0 anymore');
            isFalse(count === 1, 'count doesn\'t equal 1 anymore');
            isTrue(count === 10, 'now count equals 10');
        });
    });
    asyncTest('Is count 10?', function(){
        isFalse(count === 10, 'count doesn\'t equals 10 anymore.');
        isTrue(count === 1, 'count now equals 1 again.');
        setTimeout(function(){
            count *= 100;
        }, 10);

        whenAsyncDone(function(){
            isFalse(count === 0, 'count doesn\'t equal 0 anymore');
            isFalse(count === 1, 'count doesn\'t equal 1 anymore');
            isFalse(count === 10, 'count doesn\'t equal 10 anymore');
            isTrue(count === 100, 'count now equals 100');
        });
    });
});

group('2 asynchronous tests with "asyncAfterEachTest"', function(){
    var count = 0;
    asyncAfterEachTest(function(){
        count = 1;
    });
    asyncTest('Is count 1?', function(){
        setTimeout(function(){
            count = 10;
        }, 10);

        whenAsyncDone(function(){
            isFalse(count === 0, 'count doesn\'t equal 0 anymore');
            isFalse(count === 1, 'count doesn\'t equal 1 anymore');
            isTrue(count === 10, 'now count equals 10');
        });
    });
    asyncTest('Is count still 10?', function(){
        isFalse(count === 10, 'count doesn\'t equals 10 anymore.');
        isTrue(count === 1, 'count now equals 1 again.');
        setTimeout(function(){
            count *= 100;
        }, 10);

        whenAsyncDone(function(){
            isTrue(count === 100, 'count now equals 100');
        });
    });
});

group('The asyncBeforeEachTest can pass a value to asyncTest', function(){
    asyncBeforeEachTest(function(){
        return {num: 1};
    });
    asyncTest('Was object passed?', function(val){
        var obj;
        setTimeout(function(){
            isFalse(typeof val === 'undefined', 'obj is not undefined');
            equal(val, {num: 1}, '{num: 1} was passed to asyncTestu');
            obj = val;
            obj.num *= 100;
        }, 10);

        whenAsyncDone(function(){
            isTrue(obj.num === 100, 'now obj.num equals 100');
        });
    });
});
