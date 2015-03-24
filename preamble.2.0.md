---
layout: page
title: v2.0 API Developer Guide
permalink: /preamble/api/2/0/
---

## Introducing Preamble

Preamble is a powerful JavaScript testing framework. Preamble runs in any modern HTML5 compliant browser as well as headless via PhantomJS and has no additional dependencies on any other libraries. Preamble is backed by a very powerful assertion engine that your test scripts interface with through a very simple to use but powerful API, which makes the task of authoring tests very easy, intuitive and fun.

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
* it - _Preamble.it_
* beforeEach - _Preamble.beforeEach_
* afterEach - _Preamble.afterEach_

<p class="warning">In addition to the above, when the <em><strong>windowGlobals</strong></em> configuration option is set to <em>false</em> test callback functions are passed a hash as their first parameter through which assertions must be called. It is common to name this parameter <em><strong>assert</em></strong>:
</p>

```javascript

Preamble.it('this is a test', function(assert){
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

#### **describe** *describe(label, callback)*
**describe** provide structure and *scope* for one or more tests. **label** is a string used to uniquely identify the group. **callback** is a function which contains one or more tests. **callback** also provides *scope* to make data and code accessible to the tests.

```javascript

describe('Describe a group', function(){
    var hw = 'Hello World!';
    it('Hello World!', function(){
        isTrue(hw === 'Hello World!');
    });
})
```

Groups can also be _nested_ providing fine grained structure for organizing tests:

```javascript

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

### Tests

#### **it** *it(label, [timeout,] callback([assert,] [done]){...})*
**it** is used to define one or more _assertions_. **label** is a string used to uniquely identify a test within a _group_. **timeout** is an optional number used to override the default number of miliseconds Preamble waits before timing out a test (please see testTimeOutInterval in the Configuration section below for details). **callback** is a function which contains one or more assertions and it also provide _scope_ to make data and code accessible to assertions.

<p class="warning"><strong>assert</strong> is optional and is a <em>hash</em> that is alwyas passed as the first argument to <strong>it</strong>'s and <strong>test</strong>'s <strong>callback</strong>'s when the configuration option <em><strong>windowGlobals</strong></em> is set to <em>false</em>. It exposes the assertion API. It is common to name this parameter assert.</p>

```javascript
Preamble.it('this is a test', function(assert){
    assert.equal(...);
    assert.notEqual(...);
    assert.isTrue(...);
    assert.isFalse(...);
    assert.isTruthy(...);
    assert.isNotTruthy(...);
});
```
**done** is optional and is a _function_ that is passed as an argument to **it**'s and **test**'s **callback**s and must be called to signal that an _asynchronous_ process has completed. **done**'s '**callback** argument provides scope for one or more assertions.

```javascript

describe('A test', function(){
    it('Hello World!', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!');
    });
});
```

```javascript

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

### Setup and Teardown

#### **beforeEach** *beforeEach(callback([done]){...})*
#### **afterEach** *afterEach(callback([done]){...})*

**beforeEach** and **afterEach** are used to execute common code _before_ and _after_ each _test_, respectively. Their use enforces the _DRY_ principle. **callback** provides scope for the code that is to be run before or after each test. Values can be passed on to tests by assigning them to **callback**'s context (e.g. this.someValue = someOtherValue).

**done** is optional and is a _function_ that is passed as an argument to the **callbacks** of **beforeEach** and **afterEach** and must be called to signal that an _asynchronous_ setup/teardown process has completed.

```javascript

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

### Assertions

<p class="warning">When the <em><strong>windowGlobals</strong></em> configuration option is set to <em>false</em> test callback functions are passed a hash as their first parameter through which assertions must be called. It is common to name this parameter <em><strong>assert</em></strong>:
</p>

```javascript
Preamble.it('this is a test', function(assert){
    assert.equal(...);
    assert.notEqual(...);
    assert.isTrue(...);
    assert.isFalse(...);
    assert.isTruthy(...);
    assert.isNotTruthy(...);
});
```
#### **equal** *equal(value, expectation, label)*
A strict deep recursive comparison of **value** and **expection**. **value** and **expectation** can be any valid JavaScript primitive value or object (including functions). When comparing objects the comparison is made such that if value === expectation && expectation === value then the result will be true. **label** is a string used to uniquely identify the assertion.

#### **notEqual** *notEqual(value, expectation, label)*
A strict deep recursive comparison of **value** and **expection**. **value** and **expectation** can be any valid JavaScript primitive value or object (including functions). When comparing objects the comparison is made such that if value !== expectation && expectation !== value then the result will be true. **label** is a string used to uniquely identify the assertion.

#### **isTrue** *isTrue(value, label)*
A strict boolean assertion. Result is true if **value** is true. **label** is a string used to uniquely identify the assertion.

#### **isFalse** *isFalse(value, label)*
A strict boolean assertion. Result is true if **value** is false. **label** is a string used to uniquely identify the assertion.

#### **isTruthy** *isTruthy(value, label)*
A non strict boolean assertion. Result is true if **value** is truthy. **label** is a string used to uniquely identify the assertion.

#### **isNotTruthy** *isNotTruthy(value, label)*
A non strict boolean assertion. Result is true if **value** is not truthy. **label** is a string used to uniquely identify the assertion.

### snoop

#### **snoop** *snoop(obj, propName)*

**snoop** is a utility that is used to _spy_ on object methods. _**obj**_ is the object whose method is to be spied on. _**propName**_ is a string, its value is the _name_ of the method to spy on.

### snoop API

 _snoop_ provides a high level API for querying information about a method's invocation history:

#### **wasCalled** *someObj.snoopedMethod.wasCalled()*
Returns _true_ if snoopedMethod was called, _false_ if it wasn't called.

#### **called** *someObj.snoopedMethod.called()*
Returns the _number_ of times that snoopedMethod was called.

#### **wasCalled.nTimes** *someObj.snoopedMethod.wasCalled.nTimes(n)*
Returns _true_ if snoopedMethod was called _n_ times.

#### **contextCalledWith** *someObj.snoopedMethod.contextCalledWith()*
Returns the _context_ that snoopedMethod was called with.

#### **args.getArgument** *someObj.snoopedMethod.args.getArgument(nth)*
Returns the _nth_ argument passed to snoopedMethod.

#### **returned** *someObj.snoopedMethod.returned()*
Returns what snoopedMethod _returned_.

```javascript
//Snooping on an object's method

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
```

```javascript
//Snooping on multiple object methods

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
```

#### **threw** *someObj.snoopedMethod.threw()*
Returns _true_ if snoopedMethod _threw_ an exception.

#### **threw.withMessage** *someObj.snoopedMethod.threw.withMessage()*
Returns the message associated with the exception.

```javascript
//Snooping if a method threw an exception and for the exception's message

describe('a snooped method throws', function(){
    beforeEach(function(){
        this.foo = {
            someFn: function(){
                throw new Error('Holy Batman!');
            }
        };
    });
    it('we can query if the method threw', function(){
        var foo = this.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.threw());
        isTrue(foo.someFn.threw.withMessage('Holy Batman!'));
        isFalse(foo.someFn.threw.withMessage('Holy Batman!!'));
    });
});
```

### snoop.calls API

_**snoop.calls**_ is a low level API that provides access to the _accumulated information_ about a method's invocation history. Each invocation's information is stored in an _ACall_ hash, and has the following properties:

#### **context**
The context used (its "this").

#### **args**
The _arguments_ passed to the method.

#### **error**
If an exception was thrown when called this contains the exception's message.

#### **returned**
What the method returned.

_**snoop.calls**_ API is defined as follows:

#### **count** *calls.count()*
Returns the total number of times the method was called.

#### **forCall** *calls.forCall(n)*
Returns a hash of information for the _nth_ call to the method. The hash has the following properties:

#### **all** *calls.all()*
Returns an array of _ACall_ hashes, one for each method invocation.


```javascript
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
```

### UI Tests
Preamble adds the _div element_ with the default id of _**ui-test-container**_ to the DOM. Use of this element is reserved specifically for UI tests and Preamble itself never adds content to it nor does it ever modify its content. This element's _ID_ can be overridden via configuration (please see **Configuration** below).

#### getUiTestContainerElement()
Returns the UI test container DOM element.

```javascript
var uiTestContainerElement = getUiTestContainerElement();
```

#### getUiTestContainerElementId()
Returns the id of the UI test container DOM element.

```javascript
var elUiTestContainerElement = document.getElementById(getUiTestContainerElementId());
```

### Configuration Using preamble-config.js
The following configuration options can be overridden in the _**preamble-config.js**_ file located in the _javascripts_ folder:

#### **windowGlobals**
Default value = true. Set to false if you don't want to pollute the global name space and instead use the two global vars 'Preamble' and 'assert'.
#### **testTimeOutInterval**
Default value = 10 milliseconds. This is the value Preamble uses to wait before it times out a test. This value includes the time allocated to setup (beforeEach), teardown (afterEach) and the actual test (it or test).
#### **name**
Default value = 'Test'. Override this to display a meaningful name for your tests.
#### **uiTestContainerId**
Default value = 'ui-test-container'. Override this to use a different ID for the UI test container DOM element.
#### **hidePassedTests**
Default value = false. Set it to true to hide passed tests.

### In-line Configuration
Begining with v2.0, you can call _**configure**_ directly from within your test scripts.:

#### **configure** *configure(hash)*
Call _**configure**_ passing a _**hash**_ containing _properties_ and their associated _values_ for the configuration options to be overriden.
<p class="warning">Place the call to <em>configure</em> at the very <strong><em>top</em></strong> of your test script file.</p>
<p class="warning">Please note that the <em><strong>windowGlobals</strong></em> configuration option can only be overriden by setting its value in the <em>preamble-config.js</em> configuration file and that it cannot be overriden using <em>in-line</em> configuration. Please see <em>Configuration Using preamble-config.js</em> above.</p>

```javascript
//Place the call to configure at the top of your test script file

configure({
    name: 'Sample Test Suite',
    hidePassedTests: true,
    testTimeOutInterval: 100
});

.
.
.
```

### Running Headless With PhantomJS

<p class="warning">Please note that Preamble v2 requires PhantomJS v2.0.0 or better.</p>
<p class="warning">Please note that if you are installing the PhantomJS v2 <em>binary distribution</em> on a Mac you may need to follow the directions given <a href="https://github.com/ariya/phantomjs/issues/12900#issuecomment-74073057" target="_blank">here</a>.</p>
Beginning with v2 you can run _headless_ tests with Preamble using <a href="http://phantomjs.org" target="_blank">PhantomJS</a> v2. The following example assumes that you already have PhantomJS installed and that it can be found on the path.

1. Open up a terminal and change to your test's root folder.
2. From the command line enter "path/to/phantomjs javascripts/phantom-runner.js index.html".
