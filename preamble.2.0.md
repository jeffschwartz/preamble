---
layout: page
title: v2.0 API Developer Guide
permalink: /preamble/2/0/
---

## Introducing Preamble

Preamble is a powerful Test Driven Development framework for JavaScript written in JavaScript. Preamble runs in any modern HTML5 compliant browser as well as headless via PhantomJS and has no additional dependencies on any other libraries. Preamble is backed by a very powerful assertion engine that your test scripts interface with through a very simple to use but powerful API, which makes the task of authoring tests very easy, intuitive and fun.

This is an example of a simple *synchronous* test:

```javascript
describe('truthy', function(){
    it('true === true', function(){
        isTrue(true);
    });
});
```

And this is an example of a simple *asynchronous* test:

```javascript
describe('Running asynchronous tests', function(){
    var count = 0;
    it('calling "done"', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1);
    });
});
```

### Installing Preamble
Whenever you want to create a new environment for creating and running tests just clone the repo into a folder on your computer. That's it!

### Run The Sample Test
After you have cloned the repo you can then run the sample test script, *javascripts/sample-test.js*, by opening the *index.html* file in your browser. The index.html file is located in the repo's root folder.

Running a test script in the browser produces a report showing the results of the tests. All groups and tests are presented as *links* and when you click on them Preamble will run them again and display their details, respectively.

To repeat the test you can either refresh the browser or click on the _**run all** link_ located near the top left corner of the page.

If you want to filter out passed test, check the _**Hide passed** checkbox_ located near the top right corner of the page.

Once you have run the sample test script and familiarized yourself with the report you can then open up the sample script file in your editor and study the code to gain insight on writing your own test scripts.

### index.html
The only required tags (other than the script tags) are **&lt;div id="preamble-test-container"&gt;&lt;/div&gt;** and **&lt;div id="preamble-ui-container"&gt;&lt;/div&gt;**.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preamble</title>
    <link href='stylesheets/preamble.css' rel='stylesheet' type='text/css'>
</head>
<body>
    <!-- These are required. Do not remove them or rename their ids -->
    <div id="preamble-test-container"></div>
            <!-- v2.0.0 -->
    <div id="preamble-ui-container"></div>

    <!-- JavaScripts Go Here -->

    <!-- Place script tags that your tests depend on here -->

    <!-- The preamble-config.js file has to be loaded before preamble.js is loaded!!! -->
    <!-- Note: You don't need to include this if you are using in-line configuration!!! -->
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

## API
<p class="warning">
When the <em><strong>windowGlobals</strong></em> configuration option is set to <em>false</em> the following API functions must be called as properties of the global <em>Preamble</em> object:
</p>

* describe - _Preamble.describe_
* group - _Preamble.group_
* it - _Preamble.it_
* test - _Preamble.test_
* beforeEach - _Preamble.beforeEach_
* afterEach - _Preamble.afterEach_

<p class="warning">In addition to the above, when the <em><strong>windowGlobals</strong></em> configuration option is set to <em>false</em> test callback functions are passed a hash as their first parameter through which assertions must be called. It is common to name this paramter <em><strong>assert</em></strong>:
</p>
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
<p class="warning">
In the documentation that follows descriptions and code examples assume that the <em><strong>windowGlobals</strong></em> configuration option is set to <em>true</em>.
</p>

### Grouping Tests

#### <small>BDD Style</small> **describe** *describe(label, callback)*
#### <small>TDD Style</small> **group** *group(label, callback)*
**describe** and **group** provide structure and *scope* for one or more tests. **label** is a string used to uniquely identify the group. **callback** is a function which contains one or more tests. **callback** also provides *scope* to make data and code accessible to the tests.


```javascript
//BDD Styl

describe('Describe a group', function(){
    var hw = 'Hello World!';
    it('Hello World!', function(){
        isTrue(hw === 'Hello World!');
    });
})
```

```javascript
//TDD Style

group('Describe a group', function(){
    var hw = 'Hello World!';
    test('Hello World!', function(){
        isTrue(hw === 'Hello World!');
    });
})
```
Groups can also be _nested_ providing fine grained structure for organinzing tests:

```javascript
//BDD Style - nested groups

describe('Nested specs', function(){
    describe('Nested spec 1', function(){
        it('test 1.1', function(){
            isTrue(1);
        });
    });
    describe('Nested spec 2', function(){
        it('test 1.1', function(){
            isTrue(1);
        });
    });
});
```

```javascript
//TDD Style - nested groups

group('Nested specs', function(){
    group('Nested spec 1', function(){
        test('test 1.1', function(){
            isTrue(1);
        });
    });
    group('Nested spec 2', function(){
        test('test 2.1', function(){
            isTrue(1);
        });
    });
});
```

### Tests

#### <small>BDD Style</small> **it** *it(label, [timeout,] callback)*
#### <small>TDD Style</small> **test** *test(label, [timeout,] callback)*
**it** and **test** are used to define one or more _assertions_. **label** is a string used to uniquely identify a test within a _group_. **timeout** is an optional number used to override the default number of miliseconds Preamble waits before timing out a test (please see testTimeOutInterval in the Configuration section below for details). **callback** is a function which contains one or more assertions and it also provide _scope_ to make data and code accessible to assertions.

**done** is a _function_ that is passed as an argument to **it**'s and **test**'s **callback**s and must be called to signal that an _asynchronous_ process has completed. **done**'s '**callback** argument provides scope for one or more assertions.

```javascript
//BDD Style - a synchronous test

describe('A test', function(){
    it('Hello World!', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!');
    });
});
```

```javascript
//TDD Style - a synchronous test

group('A test', function(){
    test('Hello World!', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!');
    });
});
```

```javascript
//BDD Style - an asynchronous test

describe('When running an asynchronous test', function(){
    var count = 0;
    it('calling done signals the asynchronous process has completed ', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1);
    });
});
```

```javascript
//TDD Style - an asynchronous test

group('When running an asynchronous test', function(){
    var count = 0;
    test('calling done signals the asynchronous process has completed ', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1);
    });
});
```

```javascript
//BDD Style - preventing a long running asynchronous test from timing out

describe('When running an asynchronous test', function(){
    var count = 0;
    it('calling done signals the asynchronous process has completed ', 100, function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 50);
    });
});
```

```javascript
//TDD Style - preventing a long running asynchronous test from timing out

group('When running an asynchronous test', function(){
    var count = 0;
    test('calling done signals the asynchronous process has completed ', 100, function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 50);
    });
});
```

### Setup and Teardown

#### **beforeEach** *beforeEach(callback)*
#### **afterEach** *afterEach(callback)*

**beforeEach** and **afterEach** are used to execute common code _before_ and _after_ each _test_, respectively. Their use enforces the _DRY_ principle. **callback** provides scope for the code that is to be run before or after each test. Values can be passed on to tests by assigning them to **callback**'s context (e.g. this.someValue = someOtherValue).

**done** is a _function_ that is passed as an argument to **callback** and must be called to signal that an _asynchronous_ process has completed.

```javascript
//BDD Style - using beforeEach to synchronously execute common code before each test

describe('Using beforeEach to synchronously execute common code before each test', function(){
    var count = 0;
    beforeEachTest(function(){
        count = 1;
    });
    it('Is count 1?', function(){
        isFalse(count === 0, 'count doesn\'t equal 0');
        isTrue(count === 1, 'count does equal 1');
        isTrue((count += 1) === 2, 'count now equals 2');
    });
    it('Is count still 2?', function(){
        isFalse(count === 2, 'nope, it isn\'t still 2');
        isTrue(count === 1, 'now count equals 1');
    });
});
```

```javascript
//TDD Style - Using beforeEach to synchronously execute common code before each test

group('Using beforeEach to synchronously execute common code before each test', function(){
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

```javascript
//BDD Style - Using afterEach to synchronously execute common code after each test

describe('Using afterEach to synchronously execute common code after each test', function(){
    var count = 0;
    afterEachTest(function(){
        count = 1;
    });
    it('Is count 0?', function(){
        isTrue(count === 0, 'count does equal 0.');
    });
    it('Is count still 0?', function(){
        isFalse(count === 0, 'count doesn\'t equal 0.');
        isTrue(count === 1, 'count now equals 1.');
    });
});
```

```javascript
//TDD Style - Using afterEach to synchronously execute common code after each test

group('Using afterEach to synchronously execute common code after each test', function(){
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

```javascript
//BDD Style - Passing a value from Setup/Teardown on to a test

describe('Passing a value from Setup/Teardown on to a tests', function(){
    beforeEach(function(){
        this.value = 10;
    });
    it('the tests', function(){
        equal(this.value, 10);
    });
});
```

```javascript
//TDD Style - Passing a value from Setup/Teardown on to a test

group('Passing a value from Setup/Teardown on to a tests', function(){
    beforeEach(function(){
        this.value = 10;
    });
    test('the tests', function(){
        equal(this.value, 10);
    });
});
```

```javascript
//BDD Style - Using beforeEach to asynchronously execute common code before each test

describe('Using beforeEach to asynchronously execute common code before each test', function(){
    var count = 0;
    beforeEach(function(done){
        setTimeout(function(){
            count = 10;
            done();
        }, 1);
    });
    it('beforeEach is called', function(){
        equal(count, 10);
    });
});
```

```javascript
//TDD Style - Using beforeEach to asynchronously execute common code before each test

group('Using beforeEach to asynchronously execute common code before each test', function(){
    var count = 0;
    beforeEach(function(done){
        setTimeout(function(){
            count = 10;
            done();
        }, 1);
    });
    test('beforeEachAsync is called', function(){
        equal(count, 10);
    });
});
```

```javascript
//BDD Style - Using afterEach to asynchronously execute common code after each test

describe('Using afterEach to asynchronously execute common code after each test', function(){
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
```

```javascript
//TDD Style - Using afterEach to asynchronously execute common code after each test

group('Using afterEach to asynchronously execute common code after each test', function(){
    var count = 0;
    afterEach(function(done){
        setTimeout(function(){
            count = 1;
            done();
        }, 1);
    });
    test('the first asynchronous test', function(done){
        setTimeout(function(){
            count = 10;
            done(function(){
                isTrue(count === 10);
            });
        }, 1);
    });
    test('but subsequent asynchronous tests', function(done){
        setTimeout(function(){
            count *= 100;
            done(function(){
                isTrue(count === 100);
            });
        }, 1);
    });
});
```

```javascript
//BDD Style - preventing a long running asynchronous Setup/Teardown from timing out a test

describe('Preventing a long running asynchronous Setup/Teardown from timing out a test', function(){
    var count = 0;
    beforeEachTest(function(done){
        setTimeout(function(){
            done(function(){
                this.count = 10;
            });
        }, 50);
    });
    it('this.count should equal 10', 100, function(){
        equal(this.count, 10);
    });
});
```

```javascript
//TDD Style - preventing a long running asynchronous Setup/Teardown from timing out a test

group('Preventing a long running asynchronous Setup/Teardown from timing out a test', function(){
    var count = 0;
    beforeEachTest(function(done){
        setTimeout(function(){
            done(function(){
                this.count = 10;
            });
        }, 50);
    });
    test('this.count should equal 10', 100, function(){
        equal(this.count, 10);
    });
});
```

### Assertions

<p class="warning">When the <em><strong>windowGlobals</strong></em> configuration option is set to <em>false</em> test callback functions are passed a hash as their first parameter through which assertions must be called. It is common to name this paramter <em><strong>assert</em></strong>:
</p>
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
#### equal(value, expectation, label)
A strict deep recursive comparison of **value** and **expection**. **value** and **expectation** can be any valid JavaScript primitive value or object (including functions). When comparing objects the comparison is made such that if value === expectation && expectation === value then the result will be true. **label** is a string used to uniquely identify the assertion.

#### notEqual(value, expectation, label)
A strict deep recursive comparison of **value** and **expection**. **value** and **expectation** can be any valid JavaScript primitive value or object (including functions). When comparing objects the comparison is made such that if value !== expectation && expectation !== value then the result will be true. **label** is a string used to uniquely identify the assertion.

#### isTrue(value, label)
A strict boolean assertion. Result is true if **value** is true. **label** is a string used to uniquely identify the assertion.

#### isFalse(value, label)
A strict boolean assertion. Result is true if **value** is false. **label** is a string used to uniquely identify the assertion.

#### isTruthy(value, label) - added v1.0.7
A non strict boolean assertion. Result is true if **value** is truthy. **label** is a string used to uniquely identify the assertion.

#### isNotTruthy(value, label) - added v1.0.7
A non strict boolean assertion. Result is true if **value** is not truthy. **label** is a string used to uniquely identify the assertion.

### Snoop

### UI Tests
Preamble adds the _div element_ with the default id of _**preamble-ui-container**_ to the DOM. Use of this element is reserved specifically for UI tests and Preamble itself never adds content to it nor does it ever modify its content. This element's _ID_ can be overridden via configuration (please see **Configuration** below).

### getUiTestContainerElement()
Returns the UI test container DOM element.

```javascript
var uiTestContainerElement = getUiTestContainerElement();
```

## getUiTestContainerElementId()
Returns the id of the UI test container DOM element.

```javascript
var elUiTestContainerElement = document.getElementById(getUiTestContainerElementId());
```

### Configuration
The following configuration options can be overridden in the preamble-config.js file located in the javascripts folder:

#### shortCircuit: Default value = false. Set to true to terminate upon first failure.
#### windowGlobals: Default value = true. Set to false if you don't want to pollute the global name space and instead use the two global vars 'Preamble' and 'assert'.
#### asyncTestDelay: Default value = 10 milliseconds. Set the value used to wait before calling whenAsyncDone's callback.
#### asyncBeforeAfterTestDelay: Default value = 10 milliseconds. Set the value used to wait before calling the test's callback (asyncBeforeEachTest) and when calling the next test's callback (asyncAfterEachTest).
#### name: Default value = 'Test'. Override this to display a meaningful name for your tests.
#### uiTestContainerId: Default value = 'ui-test-container'. Override this to use a different ID for the UI test container DOM element.

### Running Headless
Beginning with v1.0.6 you can run tests with Preamble headless using [PhantomJS](http://phantomjs.org). The following example assumes that you already have PhantomJS installed and that it can be found on the path.

1. Open up a terminal and change to your test's root folder.
2. From the command line enter "phantomjs javascripts/phantom-runner.js index.html".

### Changes
v1.3.0 - the default config values for asyncTestDelay and asyncBeforeAfterTestDelay have been reduced from 500 milliseconds to 10 milliseconds, which significantly speeds up testing. Also status reporting and status messages have been improved.

v1.2.3 - rolls up v1.2.0 - v1.2.2.

v1.2.2 - bumped version number in preamble.js. If you are on v1.2.0 you can skip this release.

v1.2.1 - edited comments in preamble.js, specifically in regard to proxy. If you are on v1.2.0 you can skip this release.

v1.2.0 - proxy completely rewritten and its API simplified. proxy can now spy on property methods and now also notes the context when the wrapped function is called.

v1.1.1 - bug fix for proxy.getArgsPassed(index) which would throw an exception if argsPassed was undefined. Added check for undefined.

v1.1.0 - introduces a simpler calling converntion for proxy, removing one level of indirection. Please note that this is a breaking change. To upgrade your tests please modify your calls to proxy as follows:

```javascript
proxy(functionToBeProxied);
```
