group('Does it work?', function(){
    test('Hello World!', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!', 'Yes, it works!');
    });
});

group('Truthy versus strict boolean evaluation', function(){
    var undef;
    var def = {};
    var one = 1;
    var fls = false;
    var tru = true;
    test('When using truthy boolean evaluation', function(){
        isNotTruthy(undef, 'undefined');
        isTruthy(undef, 'undefinded');
        isNotTruthy(def, 'a valid reference');
        isTruthy(def, 'a valid reference');
        isNotTruthy(one, '1');
        isTruthy(one, '1');
        isNotTruthy(fls, 'false');
        isTruthy(fls, 'false');
        isNotTruthy(tru, 'true');
        isTruthy(tru, 'true');
    });
    test('When using strict boolean evaluation', function(){
        isFalse(undef, 'undefinded');
        isTrue(undef, 'undefinded');
        isFalse(def, 'a valid reference');
        isTrue(def, 'a valid reference');
        isFalse(one, '1');
        isTrue(one, '1');
        isFalse(fls, 'false');
        isTrue(fls, 'false');
        isFalse(tru, 'true');
        isTrue(tru, 'true');
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

group('2 slightly convoluted synchronous test with "beforeEachTest".', function(){
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

group('2 slightly convoluted synchronous test with "afterEachTest".', function(){
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

group('A simple asynchronous test', function(){
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

group('A simple asynchronous test that uses "proxy" to determine if its callback was called.', function(){
    asyncTest('Was callback called?', function(){
        var prxy = proxy();
        setTimeout(prxy(function(){
        }), 10);
        whenAsyncDone(function(){
            equal(prxy.getCalledCount(), 1, 'getCalledCount() returned 1')
            isTrue(prxy.wasCalled(), 'Yes it was called');
            isFalse(prxy.wasCalled(2), 'And it was not called twice');
            isTrue(prxy.wasCalled(1), 'It was called once');
        });
    });
});

group('2 slightly convoluted asynchronous tests with "asyncBeforeEachTest".', function(){
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

group('2 slightly convoluted asynchronous tests with "asyncAfterEachTest".', function(){
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

group('asyncBeforeEachTest can pass a value to asyncTest', function(){
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
