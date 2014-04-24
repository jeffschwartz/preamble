configure({
    name: 'Sample Test Suite',
    hidePassedTests: true
});

group('This test will intentionally fail', function(){
    test('true === false', function(){
        isTrue(false, 'Yes, true === false!');
    });
});

group('It work', function(){
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
    test('Count is 1', function(){
        isFalse(count === 0, 'count doesn\'t equal 0');
        isTrue(count === 1, 'count does equal 1');
        isTrue((count += 1) === 2, 'count now equals 2');
    });
    test('Count is still 2', function(){
        isFalse(count === 2, 'nope, it isn\'t still 2');
        isTrue(count === 1, 'now count equals 1');
    });
});

group('2 synchronous test with "afterEachTest"', function(){
    var count = 0;
    afterEachTest(function(){
        count = 1;
    });
    test('Count is 0', function(){
        isTrue(count === 0, 'count does equal 0.');
    });
    test('Count is still 0', function(){
        isFalse(count === 0, 'count doesn\'t equal 0.');
        isTrue(count === 1, 'count now equals 1.');
    });
});

group('An asynchronous test with no before/after eachTest', function(){
    asyncTest('JavaScript is amazing', function(){
        var val;
        setTimeout(function(){
            val = 'Isn\'t JavaScript amazing?';
        }, 1);
        whenAsyncDone(function(){
            isTrue(val === 'Isn\'t JavaScript amazing?', 'Yest it is!');
        });
    });
});

group('2 asynchronous tests with "asyncBeforeEachTest"', function(){
    var count = 0;
    asyncBeforeEachTest(function(){
        count = 2;
    });
    asyncTest('Count is 20', function(){
        setTimeout(function(){
            count *= 10;
        }, 1);

        whenAsyncDone(function(){
            isTrue(count === 20, 'Yes, count now is 20');
        });
    });
    asyncTest('Count is 200', function(){
        setTimeout(function(){
            count *= 100;
        }, 1);

        whenAsyncDone(function(){
            isTrue(count === 200, 'Yes, count now is 200');
        });
    });
});

group('2 asynchronous tests with "asyncAfterEachTest"', function(){
    var count = 0;
    asyncAfterEachTest(function(){
        count = 1;
    });
    asyncTest('Count is 10', function(){
        setTimeout(function(){
            count = 10;
        }, 1);

        whenAsyncDone(function(){
            isTrue(count === 10, 'Yes, count now is 10');
        });
    });
    asyncTest('Count is 100', function(){
        setTimeout(function(){
            count *= 100;
        }, 1);

        whenAsyncDone(function(){
            isTrue(count === 100, 'Yes, count now is 100');
        });
    });
});

group('The asyncBeforeEachTest can pass a value to asyncTest', function(){
    asyncBeforeEachTest(function(){
        return {num: 1};
    });
    asyncTest('Object was passed', function(val){
        setTimeout(function(){
            val.num *= 100;
        }, 1);

        whenAsyncDone(function(){
            isFalse(typeof val === 'undefined', '{num: 1} was passed to asyncTest');
            isTrue(val.num === 100, '{num: 1} was changed to {num: 100}');
        });
    });
});

group('proxy captures calling information which can be tested against', function(){
    asyncTest('proxy a function calling it twice', function(){
        var fn = proxy(function(s){
            return s;
        });
        setTimeout(function(){
            fn('Somewhere over');
            fn('the rainbow');
        }, 1);
        whenAsyncDone(function(){
            isTrue(fn.wasCalled(2), 'fn was called twice.');
            equal(fn.getCalledCount(), 2, 'fn was called twice.');
            var info1 = fn.getData(0);
            isTrue(info1.argsPassed[0] === 'Somewhere over', 'fn was passed "Somewhere over"');
            isTrue(info1.returned === 'Somewhere over', 'fn returned "Somewhere over"');
            isTrue(info1.context === undefined, 'the 1st time fn was called with global context');
            var info2 = fn.getData(1);
            isTrue(info2.argsPassed[0] === 'the rainbow', 'fn was passed "the rainbow"');
            isTrue(info2.returned === 'the rainbow', 'fn returned "Somewhere over"');
            isTrue(info2.context === undefined, 'the 2nd time fn was called with global context');
        });
    });
    asyncTest('proxy two functions calling each once', function(){
        var fn1 = proxy(function(s){
            return s;
        });
        var fn2 = proxy(function(s){
            return s;
        });
        setTimeout(function(){
            fn1('Somewhere over ');
            fn2('the rainbow');
        }, 1);
        whenAsyncDone(function(){
            isTrue(fn1.wasCalled(1), 'fn1 was called once.');
            equal(fn1.getCalledCount(), 1, 'fn1 was called once.');
            isTrue(fn2.wasCalled(1), 'fn2 was called once.');
            equal(fn2.getCalledCount(), 1, 'fn2 was called once.');
            var fn1Info = fn1.getData(0);
            isTrue(fn1Info.argsPassed[0] === 'Somewhere over ', 'fn1 was passed "Somewhere over "');
            isTrue(fn1Info.returned === 'Somewhere over ', 'fn1 returned "Somewhere over "');
            isTrue(fn1Info.context === undefined, 'fn1 was called with the global context');
            var fn2Info = fn2.getData(0);
            isTrue(fn2Info.argsPassed[0] === 'the rainbow', 'fn2 was passed "the rainbow"');
            isTrue(fn2Info.returned === 'the rainbow', 'fn2 returned "the rainbow"');
            isTrue(fn2Info.context === undefined, 'fn2 was called with the global context');
        });
    });
    asyncTest('proxy a property method calling it twice', function(){
        var foo = {
            title: '',
            name: proxy(function(s){this.title += s; return s;})
        };
        proxy(foo, 'name');
        setTimeout(function(){
            foo.name('Somewhere over ');
            foo.name('the rainbow');
        }, 1);
        whenAsyncDone(function(){
            equal(foo.title, 'Somewhere over the rainbow', 'foo.title = "Somewhere over the rainbow"');
            isTrue(foo.name.wasCalled(2), 'callback was called twice.');
            equal(foo.name.getCalledCount(), 2, 'callback was called twice.');
            var info1 = foo.name.getData(0);
            isTrue(info1.argsPassed[0] === 'Somewhere over ', 'callback was passed "Somewhere over"');
            isTrue(info1.returned === 'Somewhere over ', 'callback returned "Somewhere over "');
            isTrue(info1.context === foo, 'foo.name was called the 1st time with the foo context');
            var info2 = foo.name.getData(1);
            isTrue(info2.argsPassed[0] === 'the rainbow', 'callback was passed "the rainbow"');
            isTrue(info2.returned === 'the rainbow', 'callback returned "the rainbow"');
            isTrue(info2.context === foo, 'foo.name was called the 2nd time with the foo context');
        });
    });
});
