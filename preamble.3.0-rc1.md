---
layout: page
title: v3.0-rc1 API Developer Guide
permalink: /preamble/api/3/0/rc1/
---

## Introducing Preamble

Preamble v3 is a powerful BDD based JavaScript testing framework that runs in any modern HTML5 compliant browser as well as headless via PhantomJS. Preamble has no additional dependencies on any other libraries and has a very powerful assertion engine that your test suites interface with through a very simple to use but semantically rich and intuitive API.

This is an example of a _synchronous spec_:

```javascript
describe('running a spec synchronously', function(){
    it('and running the expectations', function(){
        expect(true).toBeTrue();
    });
});
```

And this is an example of an _asynchronous spec_. Notice the call to _**done**_:

```javascript
describe('running a spec asynchronously', function(){
    var count = 0;
    it('and calling "done" to run the expectations', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                expect(count).toEqual(100);
            });
        }, 1);
    });
});
```

### Installing Preamble
Whenever you want to create a new environment for creating and running tests just clone the repo into a folder on your computer. That's it!

### Run The Sample Test
After you have cloned the repo you can then run the sample test suite, *javascripts/sample-suite.js*, by opening the *index.html* file in your browser. The index.html file is located in Preamble's root folder.

Running a test suite in the browser produces a report showing the results of running the suite. All suites and specs are presented as *links* and when you click on them Preamble will run them again and display their details, respectively.

To repeat the test you can either refresh the browser or click on the _**run all** link_ located near the top left corner of the page.

If you want to filter out suites and specs that have passed, check the _**Hide passed** checkbox_ located near the top right corner of the page.

After you have run the sample test suite and familiarized yourself with the generated report you can then open up the sample test suite file, *javascripts/sample-suite.js*, in your favorite editor and examine the code to gain insight on writing your own test suites.

### index.html
The only required HTML tags (other than the script tags) are **&lt;div id="preamble-test-container"&gt;&lt;/div&gt;** and **&lt;div id="preamble-ui-container"&gt;&lt;/div&gt;**.

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
    <script src="javascripts/sample-suite.js"></script>
</body>
</html>
```

## API
<p class="warning">
When the <em><strong>windowGlobals</strong></em> configuration option is set to <em>false</em> the following API functions must be called as properties of the global <em>Preamble</em> object:
</p>

* configure - _Preamble.configure_
* describe - _Preamble.describe_
* beforeEach - _Preamble.beforeEach_
* afterEach - _Preamble.afterEach_
* it - _Preamble.it_
* spyOn - _Preamble.spyOn_
* expect - _Preamble.expect_
* getUiTestContainerElement - _Preamble.getUiTestContainerElement_
* getUiTestContainerElementId - _Preamble.getUiTestContainerElementId_

<p class="warning">
In the documentation that follows descriptions and code examples assume that the <em><strong>windowGlobals</strong></em> configuration option is set to <em>true</em>.
</p>

## Suites

### **describe** *describe(label, callback)*
**describe** describes a _suite_. **label** is a string used to uniquely identify the _suite_. **callback** is a function that is called by Preamble that provides structure and scope for one or more _specs_.

```javascript
describe('describes a "suite" which can contain one or more "specs"', function(){
    it('and "it" specifies a spec which can contain one or more expectations"', function(){
        expect(1).toEqual(1);
    });
});
```

## Nesting Suites

_Suites_ can be _nested_ at any level thereby providing fine grained structure and organization of your _specs_:

```javascript

describe('suites can  be nested', function(){
    describe('nested suite 1', function(){
        it('spec 1.1', function(){
            expect(1).toBeTruthy();
        });
    });
    describe('nested suite 2', function(){
        it('spec 2.1', function(){
            expect(0).not,toBeTruthy();
        });
    });
});
```

## Specs

### **it** *it(label, [timeout,] callback([done]){...})*

**it** is used to group one or more _expectations_ which are composed by pairing the _actual value_ under test with a suitable _matcher_. **label** is a string used to uniquely identify the _spec_ within a _suite_. **timeout** is optional and if provided it overrides Preamble's default _timeout interval_ which is the number of miliseconds Preamble waits before timing out a spec (please see testTimeOutInterval in the Configuration section below for details). **callback** is a function called by Preamble which contains one or more _expectations_ and which also provides _scope_ to make data and code accessible to _expectations_.

```javascript
it('is used to group one or more expectations', function(){
    expect(true).toBeTrue();
    expect(false).toBeFalse();
    expect('abc').toEqual('abc');
    expect(123).not.toEqual('abc');
});
```
**done** is optional and is a _function_ that Preamble passes to **callback** as an argument which your asynchronous _specs_ call to signal to Preamble that their _asynchronous_ processing has completed. **done** takes a single argument, a _function_, which Preamble calls to run the _expectations_.

```javascript
describe('specs can be run asynchronously', function(){
    var count = 0;
    it('and calling done signals to Preamble that the asynchronous process has completed ', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                expect(count).toEqual(100);
            });
        }, 1);
    });
});
```
## Setup and Teardown

### **beforeEach** *beforeEach(callback([done]){...})*
### **afterEach** *afterEach(callback([done]){...})*

**beforeEach** and **afterEach** are used to execute common code _before_ and _after_ each _spec_, respectively, and their use enforces the _DRY_ principle. **callback** is a function that Preamble will call to execute your _setup_ and _teardown_ code.

```javascript
describe('Using beforeEach to synchronously execute common code before each test', function(){
    var count = 0;
    beforeEach(function(){
        count = 1;
    });
    it('count equals 1', function(){
        expect(count).toEqual(1);
        count = 2;
    });
    it('count still equals 1', function(){
        expect(count).toEqual(1);
    });
});
```

```javascript
describe('Using afterEach to synchronously execute common code after each test', function(){
    var count = 0;
    afterEach(function(){
        count = 1;
    });
    it('count equals 0', function(){
        expect(count).toEqual(0);
        count = 2;
    });
    it('count still equals 1', function(){
        expect(count).toEqual(1);
    });
});
```

**done** is optional and is a _function_ that Preamble passes to **callback** as an argument and which your asynchronous _setups_ and _teardowns_ call to signal to Preamble that their _asynchronous_ processing has completed.

```javascript
describe('Using beforeEach to asynchronously execute common code before each spec is called', function(){
    var count = 0;
    beforeEach(function(done){
        setTimeout(function(){
            count = 10;
            done();
        }, 1);
    });
    it('count equals 10', function(){
        expect(count).toEqual(10);
    });
});
```

```javascript
describe('Using afterEach to asynchronously execute common code after each spec is called', function(){
    var count = 0;
    afterEach(function(done){
        setTimeout(function(){
            count = 1;
            done();
        }, 1);
    });
    it('this spec expects count to equal 0 and sets count to 10', function(){
        expect(count).toEqual(0);
        count = 10;
    });
    it('this spec expects count to equal 1', function(){
        expect(count).toEqual(1);
    });
});
```

## Preventing Specs From Timing Out

Preamble will timeout both _synchronous_ and _asynchronout_ _specs_ if they fail to complete within the 10 milisecond _timeout interval_ that Preamble defaults to. To override Preamble's default _timeout interval_ you can:

Set the _timeout interval_ for all _specs_ by either using the _javascripts/preamble-config.js_ file

```javascript
var preambleConfig = {
    testTimeOutInterval: 25,
};
```

or set the _timeout interval_ for all _specs_ using in-line configuration (see **_Configuration_** below for details on both).

```javascript
configure({
    testTimeOutInterval: 25
});
```

or set the _timeout interval_ for individual _specs_ by passing a _timeout interval_ to Preamble when calling _it()_ (see **_Specs_** above for details).

```javascript
describe('Preventing a spec from timing out', function(){
    var count = 0;
    beforeEach(function(done){
        setTimeout(function(){
            done(function(){
                count = 10;
            });
        }, 50);
    });
    it('count should equal 10', 60, function(){
        expect(count).toEqual(10);
    });
});
```

<p class="warning">
When a spec fails to complete within the <i>timeout interval</i> Preamble will fail that spec but will continue to run all remaining specs unless Preamble is configured to <i>short circuit</i> (see <i>Configuration</i> below for more information about using the <b><i>shortCircuit</i></b> configuration option).
</p>

## Sharing Variables Using _this_

Variables can be shared between _beforeEach_, _it_ and _afterEach_ (aka a BIA sequence) by assigning variables to **_this_**. Every top level BIA sequence shares the same blank context and every nested BIA sequence shares the same context as their parent BIA sequence.

```javascript
describe('Sharing values between setups, specs and teardowns using "this"', function(){
    beforeEach(function(){
        this.value = 10;
    });
    it('this.value should equal 10', function(){
        expect(this.value).toEqual(10);
    });
    describe('works in nested suites also', function(){
        beforeEach(function(){
            this.otherValue = 100;
        });
        it('this.value should equal 10 and this.otherValue should equal 100', function(){
            expect(this.value).toEqual(10);
            expect(this.otherValue).toEqual(100);
        });
    });
    it('this.otherValue should not exist and this.value should equal 10', function(){
        expect(this.otherValue).toEqual('undefined');
        expect(this.value).toEqual(10);
    });
});
```

## Expectations - _expect_, _not_ and _matchers_

_Expectations_ are declared using **_expect_**, **_not_** if negating and a suitable **_matcher_**.

For example, the expectation that a value is _truthy_ can be expressed as follows:

```javascript
describe('the value 1', function(){
    it('is truthy', function(){
        expect(1).toBeTruthy();
    });
});
```

and the expectation that a value is _not_ _truthy_ can be expressed as follows (notice the use of the _not_ API to _negate_ the intention of the _toBeTruthy_ matcher):

```javascript
describe('the value 0', function(){
    it('is not truthy', function(){
        expect(0).not.toBeTruthy();
    });
});
```

### **expect** *expect(actual)*
Call _expect_ passing it the **_actual_** value that is to be matched against using a _matcher_. **_actual_** can be any valid JavaScript primitive value or object (including functions).

### **not** *not*
Use **_not_** to negate the intention of a _matcher_ (See _Matchers_ below).

### Matchers

#### **toEqual** *toEqual(value)*
Expectations pass if both the _actual_ value and **_value_** are equal and fail if they aren't equal. A strict deep recursive comparison is made between the _actual_ value and **_value_**, which can be any valid JavaScript primitive value or object (including functions). When comparing objects the comparison is made such that if **_value_** === _actual_ value && _actual_ value === **_value_** then the two objects are considered equal.

 ```javascript
 var 
 ```

#### **toBeTrue** *toBeTrue()*
Expectations pass if the _actual_ value is _true_ and fail if it is _false_. A strict boolean evaluation is made on the _actual_ value and returns _true_ or _false_.

#### **toBeTruthy** *toBeTruthy()*
Expectations pass if the _actual_ value is _truthy and fail if it _falsy_. A non strict boolean evaluation is made on the _actual_ value and returns _true_ or _false_.

#### **toHaveBeenCalled** *toHaveBeenCalled()*
Expectations pass if the _actual_ value, which is expected to be a _spy_ (see **_Spies_** below), was called and fail if it wasn't called.

#### **toHaveBeenCalledWith** *toHaveBeenCalledWith(...theArgs)*
Expectations pass if the _actual_ value, which is expected to be a _spy_ (see **_Spies_** below), was called with **_...theArgs_** arguments and fail if it wasn't called with **_...theArgs_** arguments.

#### **toHaveBeenCalledWithContext** *toHaveBeenCalledWithContext(context)*
Expectations pass if the _actual_ value, which is expected to be a _spy_ (see **_Spies_** below), was called with **_context_** as its _context_ and fail if it wasn't called with **_context_** as its _context_.

#### **toHaveReturned** *toHaveReturned(value)*
Expectations pass if the _actual_ value, which is expected to be a _spy_ (see **_Spies_** below), returned **_value_** and fail if it didn't return **_value_**.

#### **toHaveThrown** *toHaveThrown()*
Expectations pass if the _actual_ value, which is expected to be a _spy_ (see **_Spies_** below), threw an exception and fail if it didn't throw an exception.

#### **toHaveThrownWithMessage** *toHaveThrownWithMessage(message)*
Expectations pass if the _actual_ value, which is expected to be a _spy_ (see **_Spies_** below), threw an exception with **_message_** and fail if it didn't throw an exception with **_message_**.

#### **toHaveThrownWithName** *toHaveThrownWithName(name)*
Expectations pass if the _actual_ value, which is expected to be a _spy_ (see **_Spies_** below), threw an exception with **_name_** and fail if it didn't throw an exception with **_name_**.

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
#### **shortCircuit** <span class="added"><small>v2.1.0</small></span>
Default value = false. Set it to true to cause Preamble to imediately terminate running any further tests and to then produce its coverage, summary and detail report. This is a convenient option to use if your suites take a long time to run.

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
2. From the command line enter _"path/to/phantomjs javascripts/phantom-runner.js index.html"_ which should produce output similar to the example below:
![PhantomJS Output]({{site.baseurl}}/images/phantomjs-output.jpg)
