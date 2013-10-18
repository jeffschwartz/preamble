//A simple synchronous test just to make sure that everything is honky dory!
group('Does it work?', function(){
    test('Hello World!', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!', 'Yes, it works!');
    });
});

//2 slightly convoluted synchronous tests with "beforeEachTest".
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

//2 slightly convoluted synchronous tests with afterEachTest.
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

//Comparing objects and primitives for equality using equal and notEual.
group('Comparing objects for equality using equal and notEual.', function(){
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

//A simple asynchronous test.
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

//2 slightly convoluted asynchronous tests with "asyncBeforeEachTest".
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

//2 slightly convoluted asynchronous tests with "asyncAfterEachTest".
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

//asyncBeforeEachTest can pass a value to asyncTest
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
