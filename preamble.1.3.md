---
layout: page
title: v1.3 API Developer Guide
permalink: /preamble/api/1/3/
---

<div class="warning">
<strong>Heads up!</strong> These docs are for v1.3, which is no longer officially supported. For more recent versions please see <a href="{{ site.baseurl }}/docs/">Guides & Resources</a>.
</div>

# Introducing Preamble

Preamble is a powerful JavaScript testing framework that runs in any modern HTML5 compliant browser as well as headless via PhantomJS and has no additional dependencies on any other libraries. Preamble is backed by a very powerful assertion engine that your test scripts interface with through a very simple to use but powerful API, which makes the task of authoring tests very easy, intuitive and even fun.

This is an example of a simple synchronous test:

```javascript
group('truthy', function(){
    test('true === true', function(){
        isTrue(true === true, 'true === true');
    });
});
```

And this is an example of a simple asynchronous test:

```javascript
group('asynchronous', function(){
    asyncTest('fetch data from database via Ajaax', function(){
        var promiseDone = proxy(function(){});
        var promise = db.catsCollection.fetch();
        promise.done(promiseDone);
        whenAsyncDone(function(){
            var promiseDoneInfo = promiseDone.getData();
            isTrue(promiseDone.wasCalled(1), 'promiseDone was called once');
            isTrue(promiseDoneInfo.argsPassed[0] !== 'undefined', 'cat collection was fetched');
        });
    });
});
```

# Installing Preamble
Whenever you want to create a new environment for creating and running tests just clone the repo into a folder on your computer. That's it!

# Run The Sample Test
After you have cloned the repo you can run the sample test script, javascripts/sample-test.js, by opening index.html, which is located in the repo's root folder, in your browser. All groups, tests and assertions are links and if you click on them Preamble will "drill down" and display details for each, respectively. To repeat the test you can either refresh the browser or click on the **Rerun All Tests** link located near the top of the page. After you have run the sample you can open up the script file in your editor and spy the code, which will give you a feel for how you can use Preamble's API to write your own scripts.

# index.html
The only required tag (other than the script tags) is &lt;div id="preamble-container"&gt;&lt;/div&gt;. The rendering of the results output uses a very nice serif font called Lora (thank you, [Cyreal](http://www.cyreal.org) and Google). If you don't like Lora (but who doesn't like Lora?) feel free to remove the link tag or to use a different web font.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Preamble</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href='http://fonts.googleapis.com/css?family=Lora' rel='stylesheet' type='text/css'>
    <link href='stylesheets/preamble.css' rel='stylesheet' type='text/css'>
</head>
<body>
    <!-- This is required. Do not remove or rename the id -->
    <div id="preamble-container"></div>

    <!-- JavaScripts Go Here -->

    <!-- Place script tags that your tests depend on here -->

    <!-- The preamble-config.js file has to be loaded before preamble.js is loaded!!! -->
    <!--
    <script src="javascripts/preamble-config.js"></script>
    -->

    <!-- preamble.js -->
    <script src="javascripts/preamble.js"></script>

    <!-- Place your test script(s) here, immediately following preamble.js -->
    <script src="javascripts/sample-test.js"></script>

</body>
</html>
```
# API
Please note that when the **windowGlobals** configuration option is set to false you must preface each API method listed below with "Preamble." (please see **Configuration** below). In addition, test callback functions are passed a single argument, a hash, which you must use to call assertions (please see **Assertions** below).

```javascript
Preamble.test('this is a test', function(assert){
    assert.equal(...);
    assert.notEqual(...);
    assert.isTrue(...);
    assert.isFalse(...);
    assert.isTruthy(...);
    assert.isNotTruthy(...);
});
```

## Grouping Tests

### group(label, callback(){...})
### Preamble.group(label, callback(assert){...})
group is used to group together one or more tests. **label** is a string used to uniquely identify the group. **callback** is a function which contains one or more tests. Besides containing tests, **callback** also provide closure which you can use to make data and code accessible to the tests.

```javascript
group('Does it work?', function(){
    var hw = 'Hello World!';
    test('Hello World!', function(){
        isTrue(hw === 'Hello World!', 'Yes, it works!');
    });
})
```

### beforeEachTest(callback(){...})
### Preamble.beforeEachTest(callback(){...})
beforeEachTest can be used to perform common initialization synchronously prior to calling each test. If **calback** returns a value it is passed to each test as either its 1st or 2nd parameter (for more information please see **Configuration** below). If you need to do both synchronous and asynchronous initialization before each test then use asyncBeforeEachTest (please see asyncBeforeEachTest below).

```javascript
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
```

### afterEachTest(callback(){...})
### Preamble.afterEachTest(callback(){...})
afterEachTest can be used to perform common initialization synchronously after each test is called.  If you need to do both synchronous and asynchronous initialization after each test then use asyncAfterEachTest (please see asyncAfterEachTest below).

```javascript
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
```

### asyncBeforeEachTest([interval,] callback(){...})
### Preamble.asyncBeforeEachTest([interval,] callback(){...})
asyncBeforeEachTest can be used to perform common initialization asynchronously prior to calling each test. **interval** is optional and can be used to override the default amount of time expressed in milliseconds that Preamble will wait before running the test. If **calback** returns a value it is passed to each test as either its 1st or 2nd parameter (for more information please see **Configuration** below).

```javascript
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
```

### asyncAfterEachTest([interval,] callback(){...})
### Preamble.asyncAfterEachTest([interval,] callback(){...})
asyncAfterEachTest can be used to perform common initialization asynchronously after each test is called. **interval** is optional and can be used to override the default amount of time expressed in milliseconds that Preamble will wait before running the next test in the group.

```javascript
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
```

## Synchronous Tests

### test(label, callback([beforeTestValue]){...})
### Preamble.test(label, callback(assert[,beforeTestValue]){...})
test is used to group together one or more assertions that are to be run synchronously. **label** is a string used to uniquely identify a test within a group. **callback** is a function which contains one or more assertions. Besides containing assertions, **callback** can also provide closure which you can use to make data and code accessible to the assertions. If your tests are initialized prior to being called (see beforeEachTest above) and initialization returns a value then Preamble will pass the returned value on to **callback** either as the 1st parameter if **windowGlobals** is set to true or as the 2nd parameter if **windowGlobals** is set to false (for more information please see **Configuration** below). **assert** is an object whose properties are the assertion methods (please see Assertions below).

```javascript
group('Does it work?', function(){
    test('Hello World!', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!', 'Yes, it works!');
    });
});
```
## Asynchronous Tests

### asyncTest(label, [interval,] callback([beforeTestValue]){...})
### Preamble.asyncTest(label, [interval,] callback(assert[, beforeTestValue]){...})
asyncTest is used to group together one or more assertions that are to be run asynchronously. **label** is a string used to uniquely identify a test within a group. **callback** is a function which contains one or more assertions. Besides containing assertions, **callback** can also provide closure which you can use to make data and code accessible to the assertions. If your tests are initialized prior to being called (see beforeEachTest above) and initialization returns a value then Preamble will pass the returned value on to **callback** either as the 1st parameter if **windowGlobals** is set to true or as the 2nd parameter if **windowGlobals** is set to false (for more information please see **Configuration** below). **assert** is an object whose properties are the assertion methods (please see Assertions below).

```javascript
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
```
### whenAsyncDone(callback(){...})
### Preamble.whenAsyncDone(callback(){...})
whenAsynDone starts the timer for an asyncTest. When the timer expires Preamble will then call **callback** to run the assertions for the asyncTest.

## Assertions
Please note that when the **windowGlobals** configuration option is set to false test callback functions are passed a single argument, a hash, which you must use to call assertions (please see **API** above and **Configuration** below).

```javascript
Preamble.test('this is a test', function(assert){
    assert.equal(...);
    assert.notEqual(...);
    assert.isTrue(...);
    assert.isFalse(...);
    assert.isTruthy(...);
    assert.isNotTruthy(...);
});
```

### equal(value, expectation, label)
A strict deep recursive comparison of **value** and **expection**. **value** and **expectation** can be any valid JavaScript primitive value or object (including functions). When comparing objects the comparison is made such that if value === expectation && expectation === value then the result will be true. **label** is a string used to uniquely identify the assertion.

### notEqual(value, expectation, label)
A strict deep recursive comparison of **value** and **expection**. **value** and **expectation** can be any valid JavaScript primitive value or object (including functions). When comparing objects the comparison is made such that if value !== expectation && expectation !== value then the result will be true. **label** is a string used to uniquely identify the assertion.

### isTrue(value, label)
A strict boolean assertion. Result is true if **value** is true. **label** is a string used to uniquely identify the assertion.

### isFalse(value, label)
A strict boolean assertion. Result is true if **value** is false. **label** is a string used to uniquely identify the assertion.

### isTruthy(value, label) - added v1.0.7
A non strict boolean assertion. Result is true if **value** is truthy. **label** is a string used to uniquely identify the assertion.

### isNotTruthy(value, label) - added v1.0.7
A non strict boolean assertion. Result is true if **value** is not truthy. **label** is a string used to uniquely identify the assertion.

## proxy
## var pfn = proxy(someFunction)
## var pfn = proxy(someObject, propertyName)
## var pfn = Preamble.proxy(someFunction)
## var pfn = Preamble.proxy(someObject, propertyName)
proxy is used to **spy** on calls to **someFunction** or to **someObject[propertyName]**, both of which are referred to as the **wrapped function**. proxy notes how many times the wrapped function has been called and for each call to the wrapped function proxy notes the context it was called with, the arguments that were passed to it and what it returns. proxy provides an API for retrieving the information that it has accumulated.

Using proxy to spy on a function...

```javascript
group('Using proxy on a function', function(){
    asyncTest('proxy(function) can tell you a lot abut a function', function(){
        var fn = proxy(function(amount){
            return amount;
        });
        setTimeout(function(){
            fn(1000);
        }, 10);
        whenAsyncDone(function(){
            isTrue(fn.wasCalled(1), 'If it was called - yes it was called');
            var fnInfo = fn.getData(0);
            equal(fnInfo.argsPassed[0], 1000, 'It was passed 1000');
            isTrue(finInfo.context === undefined, 'Its context was undefined');
            equal(fnInfo.returned, 1000, 'It returned 1000');
        });
    });
});
```
and to spy on a property method.

```javascript
group('Using proxy on a property method', function(){
    asyncTest('proxy(someOjbect, propertyName) can tell you a lot abut a method', function(){
        var someObject = {
            someMethod: function(amount){
                return amount;
            }
        };
        proxy(someOjbect, 'someMethod');
        setTimeout(function(){
            someOjbect.someMethod(1000);
        }, 10);
        whenAsyncDone(function(){
            isTrue(someOjbect.someMethod.wasCalled(1), 'If it was called - yes it was called');
            var fnInfo = someOjbect.someMethod.getData(0);
            equal(fnInfo.argsPassed[0], 1000, 'It was passed 1000');
            isTrue(finInfo.context === undefined, 'Its context was undefined');
            equal(fnInfo.returned, 1000, 'It returned 1000');
        });
    });
});
```
### pfn.getCalledCount()
Returns the total number of times that proxy was called.

### pfn.getContext(n)
n represents the nth invocation of the wrapped function. If n is within bounds returns the context used on the nth call to the wrapped function, otherwise returns undefined.

### pfn.getArgsPassed([n])
n represents the nth invocation of the wrapped function. If called with 'n' and 'n' is within bounds then returns an array whose elements are the arguments that were passed to the wrapped function. Otherwise, returns an array of arrays whose elements are the arguments that were passed to the wrapped function.

### pfn.getReturned([n])
n represents the nth invocation of the wrapped function. If called with 'n' and 'n' is within bounds then returns the value that the wrapped function returned, otherwise returns an array containing all the values the wrapped function returned for all invocations.

### pfn.getData(n)
n represents the nth invocation of the wrapped function. If 'n' is within bounds then returns an info object, otherwise returns undefined. An info object's property values reflect what proxy noted for that invocation of the wrapped function and include:
#### count - a number that represents the nth invocation of the wrapped function.
#### argsPassed -  an array whose elements are the arguments passed to the wrapped function when it was called.
#### context - the context used to call the wrapped function.
#### returned - what the wrapped function returned.

### pfn.wasCalled([n])
n represents the nth invocation of the wrapped function. Returns a boolean. If you just want to know if the wrapped function was called then call wasCalled with no arguments. If you want to know if the callback was called n times then pass n as an argument.

### pfn.dataIterator(callback)
A higher order function that iterates through the collected data and calls **callback** with an **info** object (see pfn.getData above) for a total of pfn.getCalledCount() times.

## UI Tests
Preamble adds a div element to the DOM which can be used for UI tests. This element's ID defaults to **ui-test-container** but can be overridden (please see **Configuration** below).

## getUiTestContainerElement()
Returns the UI test container DOM element. This element's ID defaults to **ui-test-container** but can be overridden (please see UI Tests above and **Configuration** below).

```javascript
var $uiTestContainerElement = $(getUiTestContainerElement());
```

## getUiTestContainerElementId()
Returns the id of the UI test container DOM element. This element's ID defaults to **ui-test-container** but can be overridden (please see **UI Tests** above and **Configuration** below).

```javascript
var elUiTestContainerElement =
    document.getElementById(getUiTestContainerElementId());
```

## Configuration
The following configuration options can be overridden in the preamble-config.js file located in the javascripts folder:

### shortCircuit: Default value = false. Set to true to terminate upon first failure.
### windowGlobals: Default value = true. Set to false if you don't want to pollute the global name space and instead use the two global vars 'Preamble' and 'assert'.
### asyncTestDelay: Default value = 10 milliseconds. Set the value used to wait before calling whenAsyncDone's callback.
### asyncBeforeAfterTestDelay: Default value = 10 milliseconds. Set the value used to wait before calling the test's callback (asyncBeforeEachTest) and when calling the next test's callback (asyncAfterEachTest).
### name: Default value = 'Test'. Override this to display a meaningful name for your tests.
### uiTestContainerId: Default value = 'ui-test-container'. Override this to use a different ID for the UI test container DOM element.

## Running Headless
Beginning with v1.0.6 you can run tests with Preamble headless using [PhantomJS](http://phantomjs.org). The following example assumes that you already have PhantomJS installed and that it can be found on the path.

1. Open up a terminal and change to your test's root folder.
2. From the command line enter "phantomjs javascripts/phantom-runner.js index.html".
