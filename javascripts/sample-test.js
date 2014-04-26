configure({
    name: 'Sample Test Suite',
    hidePassedTests: true
});

group('How failed tests are reported', function(){
    test('This test will intentionally fail', function(){
        isTrue(false, 'false is true');
    });
});

group('How passed tests are reported', function(){
    test('Hello World!', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!', 'Yes, it works!');
    });
});

group('Boolean assertions', function(){
    test('true', function(){
        isTrue(true, 'true is true');
    });
    test('false', function(){
        isFalse(false, 'false is false');
    });
});

group('Truthy assertions', function(){
    var undef;
    var def = {};
    var one = 1;
    var zero = 0;
    test('When using truthy boolean evaluation', function(){
        isNotTruthy(undef, 'undefined is not truthy');
        isTruthy(def, 'a valid reference to an object is truthy');
        isTruthy(one, '1 is truthy');
        isNotTruthy(zero, '0 is not truthy');
        isTruthy('1' == 1, '"1" == 1 is truthy');
    });
});

group('Strict deep recursive comparison assertions', function(){
    test('Does a equal b', function(){
        var char = 'b';
        var a = {a: 'a', b: 'b'};
        var b = {a: 'a', b: b};
        var c = {a: 'a', b: 'b'};
        var three = 3;
        notEqual(a, b, 'var a and var b are not equal.');
        equal(a, c, 'var a and var c are equal');
        equal(char, 'b', 'var char and "b" are equal');
        equal(3, three, '3 and var three are equal');
    });
});

group('Synchronous test with "beforeEachTest"', function(){
    var count = 0;
    beforeEachTest(function(){
        count = 100;
    });
    test('count is 100', function(){
        equal(count, 100, 'count equals 100');
    });
});

group('Synchronous tests with "afterEachTest"', function(){
    var count = 0;
    afterEachTest(function(){
        count = 100;
    });
    test('count is 0', function(){
        equal(count, 0, 'count equals 0.');
    });
    test('count is 100', function(){
        equal(count, 100, 'count equals 100.');
    });
});

group('Asynchronous test', function(){
    var count = 0;
    asyncTest('count is 100', 1, function(){
        count = 100;
        whenAsyncDone(function(){
            equal(count, 100, 'count equals 100');
        });
    });
});

group('Asynchronous tests with "asyncBeforeEachTest"', function(){
    var count = 0;
    asyncBeforeEachTest(1, function(){
        count = 10;
    });
    asyncTest('count is 100', 1, function(){
        count *= 10;
        whenAsyncDone(function(){
            equal(count, 100, 'count equals 100');
        });
    });
    asyncTest('count is 20', 1, function(){
        count *= 2;
        whenAsyncDone(function(){
            equal(count, 20, 'count x 2 = 20');
        });
    });
});

group('2 asynchronous tests with "asyncAfterEachTest"', function(){
    var count = 0;
    asyncAfterEachTest(1, function(){
        count = 1;
    });
    asyncTest('count is 10', 1, function(){
        count = 10;
        whenAsyncDone(function(){
            isTrue(count === 10, 'count equals 10');
        });
    });
    asyncTest('count is 100', 1, function(){
        count *= 100;
        whenAsyncDone(function(){
            isTrue(count === 100, 'Yes, count now is 100');
        });
    });
});

group('The asyncBeforeEachTest can pass a value to asyncTest', function(){
    asyncBeforeEachTest(1, function(){
        return {num: 1};
    });
    asyncTest('Object was passed', 1, function(val){
        val.num *= 100;
        whenAsyncDone(function(){
            isFalse(typeof val === 'undefined', '{num: 1} was passed to asyncTest');
            isTrue(val.num === 100, '{num: 1} was changed to {num: 100}');
        });
    });
});

group('proxy captures calling information which can be tested against', function(){
    test('proxy a function calling it twice', function(){
        var fn = proxy(function(s){
            return s;
        });
        fn('Somewhere over');
        fn('the rainbow');
        isTrue(fn.wasCalled(2), 'fn.wasCalled(2) returned true.');
        equal(fn.getCalledCount(), 2, 'fn.getCalledCount() returned 2.');
        var info1 = fn.getData(0);
        isTrue(info1.argsPassed[0] === 'Somewhere over', 'fn was passed "Somewhere over"');
        isTrue(info1.returned === 'Somewhere over', 'fn returned "Somewhere over"');
        isTrue(info1.context === undefined, 'fn was called the 1st time with the global context');
        var info2 = fn.getData(1);
        isTrue(info2.argsPassed[0] === 'the rainbow', 'fn was passed "the rainbow"');
        isTrue(info2.returned === 'the rainbow', 'fn returned "Somewhere over"');
        isTrue(info2.context === undefined, 'fn was called the 2nd time with the global context');
    });
    test('proxy two functions calling each once', function(){
        var fn1 = proxy(function(s){
            return s;
        });
        var fn2 = proxy(function(s){
            return s;
        });
        fn1('Somewhere over ');
        fn2('the rainbow');
        isTrue(fn1.wasCalled(1), 'fn1.wasCalled(1) returned true.');
        equal(fn1.getCalledCount(), 1, 'fn1.getCalledCount() returned 1.');
        isTrue(fn2.wasCalled(1), 'fn2.wasCalled(1) returned true.');
        equal(fn2.getCalledCount(), 1, 'fn2.getCalledCount() returned 1.');
        var fn1Info = fn1.getData(0);
        isTrue(fn1Info.argsPassed[0] === 'Somewhere over ', 'fn1 was passed "Somewhere over "');
        isTrue(fn1Info.returned === 'Somewhere over ', 'fn1 returned "Somewhere over "');
        isTrue(fn1Info.context === undefined, 'fn1 was called with the global context');
        var fn2Info = fn2.getData(0);
        isTrue(fn2Info.argsPassed[0] === 'the rainbow', 'fn2 was passed "the rainbow"');
        isTrue(fn2Info.returned === 'the rainbow', 'fn2 returned "the rainbow"');
        isTrue(fn2Info.context === undefined, 'fn2 was called with the global context');
    });
    test('proxy a property method calling it twice', function(){
        var foo = {
            title: '',
            name: proxy(function(s){this.title += s; return s;})
        };
        proxy(foo, 'name');
        foo.name('Somewhere over ');
        foo.name('the rainbow');
        equal(foo.title, 'Somewhere over the rainbow', 'foo.title = "Somewhere over the rainbow"');
        isTrue(foo.name.wasCalled(2), 'foo.name.wasCalled(2) returned true.');
        equal(foo.name.getCalledCount(), 2, 'foo.name.getCalledCount() returned 2.');
        var info1 = foo.name.getData(0);
        isTrue(info1.argsPassed[0] === 'Somewhere over ', 'foo.name was passed "Somewhere over"');
        isTrue(info1.returned === 'Somewhere over ', 'foo.name returned "Somewhere over "');
        isTrue(info1.context === foo, 'foo.name was called the 1st time with the foo context');
        var info2 = foo.name.getData(1);
        isTrue(info2.argsPassed[0] === 'the rainbow', 'foo.name was passed "the rainbow"');
        isTrue(info2.returned === 'the rainbow', 'foo.name returned "the rainbow"');
        isTrue(info2.context === foo, 'foo.name was called the 2nd time with the foo context');
    });
});
