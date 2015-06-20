---
layout: devguide
title: v3.0 API Developer Guide
permalink: /preamble/api/3/0/
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

## Installing Preamble
Whenever you want to create a new environment for creating and running tests just clone the repo into a folder on your computer. That's it!

## Run The Sample Test
After you have cloned the repo you can then run the sample test suite, *javascripts/sample-suite.js*, by opening the *index.html* file in your browser. The index.html file is located in Preamble's root folder.

Running a test suite in the browser produces a report showing the results of running the suite. All suites and specs are presented as *links* and when you click on them Preamble will run them again and display their details, respectively.

To repeat the test you can either refresh the browser or click on the _**run all** link_ located near the top left corner of the page.

If you want to filter out suites and specs that have passed, check the _**Hide passed** checkbox_ located near the top right corner of the page.

After you have run the sample test suite and familiarized yourself with the generated report you can then open up the sample test suite file, *javascripts/sample-suite.js*, in your favorite editor and examine the code to gain insight on writing your own test suites.

## index.html
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
**describe** is used to describe a _suite_ which can contain one or more _specs_. **label** is a string used to uniquely identify the _suite_. **callback** is a function that is called by Preamble that provides structure and scope for one or more _specs_.

```javascript
describe('"describe" is used to describe a suite which can contain one or more specs', function(){
    it('and "it" is used to describe a spec and is used to group one or more expectations"', function(){
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
            expect(0).not.toBeTruthy();
        });
    });
});
```

## Specs

### **it** *it(label, callback([done]){...}, [timeoutInterval])*

**it** is used to describe a _spec_ and is used to group one or more _expectations_, which are composed by pairing the _actual value_ under test with an appropriate _matcher_. **label** is a string used to uniquely identify the _spec_ within a _suite_. **timeoutInterval** is optional and if provided it overrides Preamble's default _timeout interval_ which is the number of miliseconds Preamble waits before timing out a spec (please see timeoutInterval in the Configuration section below for details). **callback** is a function called by Preamble which contains one or more _expectations_ and which also provides _scope_ to make data and code accessible to _expectations_.

```javascript
it('"it" is used to describe a spec and is used to group one or more expectations', function(){
    expect(true).toBeTrue();
    expect(false).not.toBeTrue();
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

Preamble will timeout both _synchronous_ and _asynchronout_ _specs_ if they fail to complete within the 50 milisecond _timeout interval_ that Preamble defaults to. To override Preamble's default _timeout interval_ you can:

Set the _timeout interval_ for all _specs_ by modifying the _javascripts/preamble-config.js_ file

```javascript
var preambleConfig = {
    timeoutInterval: 100
};
```

or set the _timeout interval_ for all _specs_ using in-line configuration (see **_Configuration_** below for details on both).

```javascript
configure({
    timeoutInterval: 100
});
```

or set the _timeout interval_ for individual _specs_ by passing a _timeout interval_ (an integer) to Preamble when calling _it()_ (see **_Specs_** above for details).

```javascript
describe('Preventing a spec from timing out', function(){
    var count = 0;
    beforeEach(function(done){
        setTimeout(function(){
            done(function(){
                count = 10;
            });
        }, 80);
    });
    it('count should equal 10', function(){
        expect(count).toEqual(10);
    }, 100);
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
        expect(this.otherValue).toEqual(undefined);
        expect(this.value).toEqual(10);
    });
});
```

## Expectations - _expect_, _not_ and _matchers_

_Expectations_ are declared using **_expect_**, **_not_** if negating, and an appropriate **_matcher_**.

### **expect** *expect(actual)*
Call _expect_ passing it the **_actual_** value that is to be matched against the _expected_ value using a _matcher_. **_actual_** can be any valid JavaScript primitive value or object (including functions).

```javascript
describe('Calling expect', function(){
    it('sets the actual value for the expectation', function(){
        expect(1).toBeTruthy();
    });
});
```

### **not** *not*
Use **_not_** to negate the intention of a _matcher_ (See _Matchers_ below).

```javascript
describe('Using not', function(){
    it('negates the intention of a matcher', function(){
        expect(0).not.toBeTruthy();
    });
});
```

## Matchers

### **toEqual** *toEqual(value)*
Expectations pass if both the _actual_ value and the _expected_ **_value_** are equal and fail if they aren't equal. A strict deep recursive comparison is made between the _actual_ value and the _expected_ **_value_**, which can be any valid JavaScript primitive value or object (including functions). When comparing objects the comparison is made such that if _expected_ **_value_** === _actual_ value and _actual_ value === _expected_ **_value_** then the two objects are considered equal.

 ```javascript
describe('Calling toEqual', function(){
    it('sets the expectation that the actual and expected values are equal' , function(){
        var obj1 = {iAm: 'I am!'},
            obj2 = {iAm: 'I am!'},
            obj3 = {iAm: 'Obj3'};
        expect(obj1).toEqual(obj2);
        expect(obj2).not.toEqual(obj3);
    });
});
 ```

### **toBeTrue** *toBeTrue()*
Expectations pass if the _actual_ value is _true_ and fail if it is _false_. A strict boolean evaluation is made on the _actual_ value and returns _true_ or _false_.

 ```javascript
describe('Calling toBeTrue', function(){
    it('sets the expectation that the actual value is true' , function(){
        expect(true).toBeTrue();
        expect(false).not.toBeTrue();
    });
});
 ```

### **toBeTruthy** *toBeTruthy()*
Expectations pass if the _actual_ value is _truthy and fail if it _falsy_. A non strict boolean evaluation is made on the _actual_ value and returns _true_ or _false_.

 ```javascript
describe('Calling toBeTruthy', function(){
    it('sets the expectation that the actual value is truthy' , function(){
        expect(1).toBeTruthy();
        expect(0).not.toBeTruthy();
    });
});
 ```

### **toHaveBeenCalled** *toHaveBeenCalled()*
Expectations pass if the _actual_ value, which must be a _spy_ (see **_Spies_** below), was called and fail if it wasn't called.

 ```javascript
describe('Calling toHaveBeenCalled', function(){
    it('sets the expectation that the actual value, a function, was called' , function(){
        var spy1 = spyOn(),
            spy2 = spyOn();
        spy1();
        expect(spy1).toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
    });
});
 ```

### **toHaveBeenCalledWith** *toHaveBeenCalledWith(...theArgs)*
Expectations pass if the _actual_ value, which must be a _spy_ (see **_Spies_** below), was called with the _expected_ **_...theArgs_** arguments and fail if it wasn't called with _expected_ **_...theArgs_** arguments.

 ```javascript
describe('Calling toHaveBeenCalledWith', function(){
    it('sets the expectation that the actual value, a function, was called with specific arguments' , function(){
        var spy = spyOn();
        spy('abc', 'def');
        expect(spy).toHaveBeenCalledWith('abc', 'def');
        expect(spy).not.toHaveBeenCalledWith('def', 'abc');
    });
});
 ```

### **toHaveBeenCalledWithContext** *toHaveBeenCalledWithContext(context)*
Expectations pass if the _actual_ value, which must be a _spy_ (see **_Spies_** below), was called with the _expected_ **_context_** as its _context_ and fail if it wasn't called with the _expected_ **_context_** as its _context_.

 ```javascript
describe('Calling toHaveBeenCalledWithContext', function(){
    it('sets the expectation that the actual value, a function, was called with a specific context' , function(){
        var someObject = {
                someFn: function(){}
            },
            someOtherObject = {} ;
        spyOn(someObject, 'someFn');
        someObject.someFn();
        expect(someObject.someFn).toHaveBeenCalledWithContext(someObject);
        expect(someObject.someFn).not.toHaveBeenCalledWithContext(someOtherObject);
    });
});
 ```

### **toHaveReturned** *toHaveReturned(value)*
Expectations pass if the _actual_ value, which must be a _spy_ (see **_Spies_** below), returned the _expected_ **_value_** and fail if it didn't return the _expected_ **_value_**.

 ```javascript
describe('Calling toHaveReturned', function(){
    it('sets the expectation that the actual value, a function, returned a specific value' , function(){
        var spy = spyOn().and.return({fName: 'George', lName: 'Washington'});
        spy();
        expect(spy).toHaveReturned({fName: 'George', lName: 'Washington'});
        expect(spy).not.toHaveReturned({fName: 'Washington', lName: 'George'});
    });
});
 ```

### **toHaveThrown** *toHaveThrown()*
Expectations pass if the _actual_ value, which must be a _spy_ (see **_Spies_** below), threw an exception and fail if it didn't throw an exception.

 ```javascript
describe('Calling toHaveThrown', function(){
    it('sets the expectation that the actual value, a function, threw an exception', function(){
        var someFn = spyOn(function(arg){ return a + arg; }).and.callActual(),
            someOtherFn = spyOn(function(arg){ return arg; }).and.callActual();
        someFn(20);
        someOtherFn('abc');
        expect(someFn).toHaveThrown();
        expect(someOtherFn).not.toHaveThrown();
    });
});
 ```

### **toHaveThrownWithMessage** *toHaveThrownWithMessage(message)*
Expectations pass if the _actual_ value, which must be a _spy_ (see **_Spies_** below), threw an exception with a specific **_message_** and fail if it didn't throw an exception with a specific **_message_**.

 ```javascript
describe('Calling toHaveThrownWithMessage', function(){
    it('sets the expectation that the actual value, a function, threw an exception with a specific message', function(){
        var someFn = spyOn().and.throwWithMessage('Whoops!');
        someFn();
        expect(someFn).toHaveThrownWithMessage('Whoops!');
        expect(someFn).not.toHaveThrownWithMessage('Whoops! That was bad.');
    });
});
 ```

### **toHaveThrownWithName** *toHaveThrownWithName(name)*
Expectations pass if the _actual_ value, which must be a _spy_ (see **_Spies_** below), threw an exception with a specific **_name_** and fail if it didn't throw an exception with a specific **_name_**.

 ```javascript
describe('Calling toHaveThrownWithName', function(){
    it('sets the expectation that the actual value, a function, threw an exception with a specific name', function(){
        var someFn = spyOn().and.throwWithName('Error');
        someFn();
        expect(someFn).toHaveThrownWithName('Error');
        expect(someFn).not.toHaveThrownWithName('MinorError');
    });
});
 ```

## Test Doubles
Preamble provides an assortment of _test doubles_ including **_spies_**, **_stubs_**, **_fakes_** and **_mocks_**. Rather than providing separate APIs for each, Preamble encapsulates all of them within its _spy_ implementation.

## Spies
**_Spies_** are _functions_ and _object methods_ that can track all _calls_, _contexts_, _arguments_ and _return values_.

## Creating Spies
Spies are created by calling one of the several forms of **_spyOn()_ or by calling **_spyOn.x()_**.

### **spyOn** *spyOn()*
Creates a _spy_ from an anonymous function.

```javascript
describe('Calling spyOn() without arguments', function(){
    it('creates a spy from an anonymous function', function(){
        var anonFn = spyOn();
        anonFn();
        expect(anonFn).toHaveBeenCalled();
    });
});
```

### **spyOn** *spyOn(fn)*
Creates a _spy_ from the function **_fn_**.

```javascript
describe('Calling spyOn(fn)', function(){
    it('creates a spy from the function fn', function(){
        var someSpy;
        function someFn(){}
        someSpy = spyOn(someFn);
        someSpy();
        expect(someSpy).toHaveBeenCalled();
    });
});
```

### **spyOn** *spyOn(object, methodName)*
Creates a spy from **_object[methodName]_**.

```javascript
describe('Calling spyOn(object, methodName)', function(){
    it('creates a spy from object[methodName]', function(){
        var someObject = {
           someFn: function(){}
        };
        spyOn(someObject, 'someFn');
        someObject.someFn();
        expect(someObject.someFn).toHaveBeenCalled();
    });
});
```

### **spyOn.x** *spyOn.x(object, methodNames)*
Creates a _spy_ from _object[methodName]_ for each _methodName_ found in the array **_methodNames_**.

```javascript
describe('Calling spyOn.x(object, methodNames)', function(){
    it('creates a spy from object[methodName] for each methodName found in the array methodNames', function(){
        var someObject = {
           someFn: function(){},
           someOtherFn: function(){}
        };
        spyOn.x(someObject, ['someFn', 'someOtherFn']);
        someObject.someFn();
        expect(someObject.someFn).toHaveBeenCalled();
        someObject.someOtherFn();
        expect(someObject.someOtherFn).toHaveBeenCalled();
    });
});
```

## Spy _calls_ API
Information is accumulated for each call to a _spy_ and the _calls_ API can be used to query that information.

### **calls.count** *calls.count()*
Returns the number of times the spy was called.

```javascript
describe('Calling calls.count()', function(){
    it('returns the number of times the spy was called', function(){
        var someFn = spyOn();
        someFn();
        expect(someFn.calls.count()).toEqual(1);
    });
});
```

### **calls.forCall** *calls.forCall(nth)*
Returns the _ACall_ object (see ACall API below for details) associated with the **_nith_**, an integer, call.

```javascript
describe('Calling calls.forCall(nth)', function(){
    it('returns an ACall object', function(){
        var someFn = spyOn(),
            aCall;
        someFn();
        aCall = someFn.calls.forCall(0);
        expect(aCall.hasOwnProperty('context')).toBeTrue();
        expect(aCall.hasOwnProperty('args')).toBeTrue();
        expect(aCall.hasOwnProperty('error')).toBeTrue();
        expect(aCall.hasOwnProperty('returned')).toBeTrue();
    });
});
```

### **calls.all** *calls.all()*
Returns an array of all the _ACall_ objects (see ACall API below for details) associated with the _spy_.

```javascript
describe('Calling calls.all()', function(){
    it('returns an array of all the ACall objects associated with the spy', function(){
        var someFn = spyOn();
        someFn();
        expect(someFn.calls.all().length).toEqual(1);
    });
});
```

### **calls.wasCalledWith** *calls.wasCalledWith(...args)*
Returns true if the _spy_ was called with **_...args_** and false if it was not called with **_...args_**.

```javascript
describe('Calling calls.wasCalledWith(...args)', function(){
    it('returns true if the spy was called with args and false if it was not called with args', function(){
        var someFn = spyOn();
        someFn(123, 'abc', {zip: 55555});
        expect(someFn.calls.wasCalledWith(123, 'abc', {zip: 55555})).toBeTrue();
    });
});
```

### **calls.wasCalledWithContext** *calls.wasCalledWithContext(object)*
Returns true if the _spy_ was called with the context **_object_** and false if it was not called with the context **_object_**.

```javascript
describe('Calling calls.wasCalledWithContext(object)', function(){
    it('returns true if the spy was called with the context object and false if it was not called with the context object', function(){
        var someObj = {
            someFn: function(){}
        };
        spyOn(someObj, 'someFn');
        someObj.someFn();
        expect(someObj.someFn.calls.wasCalledWithContext(someObj)).toBeTrue();
    });
});
```

### **calls.returned** *calls.returned(value)*
Returns true if the _spy_ returned **_value_** and false if it did not return **_value_**.

```javascript
describe('Calling calls.returned(value)', function(){
    it('returns true if the spy returned value and false if it did not return value', function(){
        var someObj = {
            someFn: function(num){return num;}
        };
        spyOn(someObj, 'someFn').and.callActual();
        someObj.someFn(123);
        expect(someObj.someFn.calls.returned(123)).toBeTrue();
    });
});
```

### **calls.threw** *calls.threw()*
Returns true if the _spy_ threw an exception and false if it did not throw an exception.

```javascript
describe('Calling calls.threw()', function(){
    it('Returns true if the spy threw an exception and false if it did not throw an exception', function(){
        var someFn = spyOn().and.throw();
        someFn();
        expect(someFn.calls.threw()).toBeTrue();
    });
});
```

### **calls.threwWithMessage** *calls.threwWithMessage(message)*
Returns true if the _spy_ threw an exception with **_message_** and false if it did not throw an exception with **_message_**.

```javascript
describe('Calling calls.threwWithMessage()', function(){
    it('Returns true if the spy threw an exception with message and false if it did not throw an exception with message', function(){
        var someFn = spyOn().and.throwWithMessage('Whoops!');
        someFn();
        expect(someFn.calls.threwWithMessage('Whoops!')).toBeTrue();
    });
});
```

### **calls.threwWithName** *calls.threwWithName(name)*
Returns true if the _spy_ threw an exception with **_name_** and false if it did not throw an exception with **_name_**.

```javascript
describe('Calling calls.threwWithName()', function(){
    it('Returns true if the _spy_ threw an exception with **_name_** and false if it did not throw an exception with **_name_**', function(){
        var someFn = spyOn().and.throwWithName('Error');
        someFn();
        expect(someFn.calls.threwWithName('Error')).toBeTrue();
    });
});
```

### **reset** *reset()*
Resets a spy back to its default state.

```javascript
describe('Calling and.reset', function(){
    it('resets the spy back to its default state', function(){
        var someFn = spyOn();
        someFn();
        expect(someFn).toHaveBeenCalled();
        someFn.and.reset();
        expect(someFn).not.toHaveBeenCalled();
    });
});
```

## Spy _ACall_ API

An _ACall_ object encapsulates the information pertaining to a single specfic call to a _spy_ and the _ACall_ API can be used to query that information. To obtain an ACall object for a single specific call to a _spy_ call the calls API forCall method (See calls API above).

### **_getContext_** *getContext()*
Returns the _context_ that was used for a specific call to the _spy_.

```javascript
describe('Calling getContext()', function(){
    it('returns the context that was used for a specific call to the _spy_', function(){
        var someObject = {
            someFn: function(){}
        };
        spyOn(someObject, 'someFn');
        someObject.someFn();
        expect(someObject.someFn.calls.forCall(0).getContext()).toEqual(someObject);
    });
});
```

### **_getArgs_** *getArgs()*
Returns an _Args_ object (See Args API below) for a specific call to the _spy_.

```javascript
describe('Calling getArgs()', function(){
    it('returns an Args object for a specific call to the spy', function(){
        var someObject = {
            someFn: function(){}
        };
        spyOn(someObject, 'someFn');
        someObject.someFn(123);
        expect(someObject.someFn.calls.forCall(0).getArgs().args).toEqual([123]);
    });
});
```

### **_getArg_** *getArg(nth)*
Works like arguments[**_nth_**] for a specific call to the _spy_.

```javascript
describe('Calling getArg(nth)', function(){
    it('works like arguments[nth] for a specific call to the spy', function(){
        var someObject = {
            someFn: function(){}
        };
        spyOn(someObject, 'someFn');
        someObject.someFn(123, 456);
        expect(someObject.someFn.calls.forCall(0).getArg(0)).toEqual(123);
        expect(someObject.someFn.calls.forCall(0).getArg(1)).toEqual(456);
    });
});
```

### **_getArgsLength_** *getArgsLength()*
Works like arguments.length for a specific call to the _spy_.

```javascript
describe('Calling getArgsLength()', function(){
    it('works like arguments.length for a specific call to the spy', function(){
        var someObject = {
            someFn: function(){}
        };
        spyOn(someObject, 'someFn');
        someObject.someFn(123, 456);
        expect(someObject.someFn.calls.forCall(0).getArgsLength()).toEqual(2);
    });
});
```

### **_getArgProperty_** *getArgProperty(nth, propertyName)*
Works like arguments[**_nth_**][**_propertyName_**] for a specific call to the _spy_.

```javascript
describe('Calling getProperty(nth, propertyName)', function(){
    it('works like arguments[nth][propertyName] for a specific call to the spy', function(){
        var someObject = {
            someFn: function(){}
        };
        spyOn(someObject, 'someFn');
        someObject.someFn({fName: 'Abraham', lName: 'Lincoln'});
        expect(someObject.someFn.calls.forCall(0).getArgProperty(0, 'fName')).toEqual('Abraham');
        expect(someObject.someFn.calls.forCall(0).getArgProperty(0, 'lName')).toEqual('Lincoln');
    });
});
```

### **_hasArgProperty_** *hasArgProperty(nth, propertyName)*
Works like **_propertyName_** in arguments[**_nth_**] for a specific call to the _spy_.

```javascript
describe('Calling hasArgProperty(nth, propertyName)', function(){
    it('works like propertyName in arguments[nth] for a specific call to the _spy_', function(){
        var someObject = {
            someFn: function(){}
        };
        spyOn(someObject, 'someFn');
        someObject.someFn({fName: 'Abraham', lName: 'Lincoln'});
        expect(someObject.someFn.calls.forCall(0).hasArgProperty(0, 'fName')).toBeTrue();
        expect(someObject.someFn.calls.forCall(0).hasArgProperty(0, 'lName')).toBeTrue();
        expect(someObject.someFn.calls.forCall(0).hasArgProperty(0, 'address')).not.toBeTrue();
    });
});
```

### **_hasArg_** *hasArg(n)*
Works like **_n_** >= 0 && **_n_** < arguments.length for a specific call to the _spy_.

```javascript
describe('Calling hasArg(n)', function(){
    it('works like n >= 0 && n < arguments.length for a specific call to the spy', function(){
        var someObject = {
            someFn: function(){}
        };
        spyOn(someObject, 'someFn');
        someObject.someFn('123', 123);
        expect(someObject.someFn.calls.forCall(0).hasArg(0)).toBeTrue();
        expect(someObject.someFn.calls.forCall(0).hasArg(1)).toBeTrue();
    });
});
```
### **_getError_** *getError()*
Returns the _error_ associated with a specific call to the _spy_.

```javascript
describe('Calling getError()', function(){
    it('returns the error associated with a specific call to the spy', function(){
        var someObject = {
            someFn: function(number){return number + a;}
        };
        spyOn(someObject, 'someFn').and.callActual();
        someObject.someFn(123);
        expect(someObject.someFn.calls.forCall(0).getError()).toBeTruthy();
    });
});
```

### **_getReturned_** *getReturned()*
Returns the value returned from a specific call to the _spy_.

```javascript
describe('Calling getReturned()', function(){
    it('returns the value returned from a specific call to the spy', function(){
        var someObject = {
            someFn: function(number){return number + 1;}
        };
        spyOn(someObject, 'someFn').and.callActual();
        someObject.someFn(123);
        expect(someObject.someFn.calls.forCall(0).getReturned()).toEqual(124);
    });
});
```

## Spy _Args_ API
An _Args_ object encapsulates all the _arguments_ passed to a specific call to the _spy_. To obtain an Args object call the _ACall getArgs_ method (See _ACall_ API above).

### **_getLength_** *getLength()*
Works like arguments.length.

```javascript
describe('Calling getLength()', function(){
    it('works like arguments.length', function(){
        var someFn = spyOn();
        someFn(123, 'abc', {zip: 55555});
        expect(someFn.calls.forCall(0).getArgs().getLength()).toEqual(3);
    });
});
```

### **_hasArg_** *hasArg(n)*
Works like **_n_** >= 0 && **_n_** < arguments.length for a specific call to the _spy_.

```javascript
describe('Calling hasArg(n)', function(){
    it('works like n >= 0 && n < arguments.length for a specific call to the spy', function(){
        var someFn = spyOn();
        someFn(123, 'abc', {zip: 55555});
        expect(someFn.calls.forCall(0).getArgs().hasArg(2)).toBeTrue();
    });
});
```

### **_getArg_** *getArg(n)*
Works like arguments[**_nth_**].

```javascript
describe('Calling getArg(n)', function(){
    it('works like arguments[nth]', function(){
        var someFn = spyOn();
        someFn(123, 'abc', {zip: 55555});
        expect(someFn.calls.forCall(0).getArgs().getArg(2)).toEqual({zip: 55555});
    });
});
```

### **_hasArgProperty_** *hasArgProperty(nth, propertyName)*
Works like **_propertyName_** in arguments[**_nth_**].

```javascript
describe('Calling hasArgProperty(nth, propertyName)', function(){
    it('works like propertyName in arguments[nth]', function(){
        var someFn = spyOn();
        someFn(123, 'abc', {zip: 55555});
        expect(someFn.calls.forCall(0).getArgs().hasArgProperty(2, 'zip')).toBeTrue();
        expect(someFn.calls.forCall(0).getArgs().hasArgProperty(2, 'address')).not.toBeTrue();
    });
});
```

### **_getArgProperty_** *getArgProperty(nth, propertyName)*
Works like arguments[**_nth_**][**_propertyName_**].

```javascript
describe('Calling getArgProperty(nth, propertyName)', function(){
    it('works like arguments[nth][propertyName]', function(){
        var someFn = spyOn();
        someFn(123, 'abc', {zip: 55555});
        expect(someFn.calls.forCall(0).getArgs().getArgProperty(2, 'zip')).toEqual(55555);
    });
});
```

## Stubs
**_Stubs_** are _spies_ that have predefined behaviors (canned responses) and by default they do not call their actual underlying implementations. Predefine behaviors are added by using the _and_ API.

## Stubs API

### **_and.callWithContext_** *and.callWithContext(object)*
Instructs the _stub_ to use **_object_** as its context (_this_) when it is called.

```javascript
describe('Calling and.callWithContext(object)', function(){
    it('instructs the stub to use object as its context (this) when it is called', function(){
        var context = {},
            someFn = spyOn().and.callWithContext(context);
        someFn();
        expect(someFn).toHaveBeenCalledWithContext(context);
    });
});
```

### **_and.throw_** *and.throw()*
Instructs the _stub_ to throw an exception when it is called.

```javascript
describe('Calling and.throw()', function(){
    it('instructs the stub to throw an exception when it is called', function(){
        var someFn = spyOn().and.throw();
        someFn();
        expect(someFn).toHaveThrown();
    });
});
```

### **_and.throwWithMessage_** *and.throwWithMessage(message)*
Instructs the _stub_ to throw an exception with **_message_** when it is called.

```javascript
describe('Calling and.throwWithMessage(message)', function(){
    it('instructs the stub to throw an exception with message when it is called', function(){
        var someFn = spyOn().and.throwWithMessage('Whoops!');
        someFn();
        expect(someFn).toHaveThrownWithMessage('Whoops!');
    });
});
```

### **_and.throwWithName_** *and.throwWithName(name)*
Instructs the _stub_ to throw an exception with **_name_** when it is called.

```javascript
describe('Calling and.throwWithName(name)', function(){
    it('instructs the stub to throw an exception with name when it is called', function(){
        var someFn = spyOn().and.throwWithName('Error');
        someFn();
        expect(someFn).toHaveThrownWithName('Error');
    });
});
```

### **_and.return_** *and.return(value)*
Instructs the _stub_ to return **_value_** when it is called.

```javascript
describe('Calling and.return(value)', function(){
    it('instructs the stub to return value when it is called', function(){
        var someFn = spyOn().and.return({zip: 55555});
        someFn();
        expect(someFn).toHaveReturned({zip: 55555});
    });
});
```

### **_and.callActual_** *and.callActual()*
Instructs the _stub_ to call its **_actual_** underlying implementation when it is called.

```javascript
describe('Calling and.callActual()', function(){
    it('instructs the stub to call its actual underlying implementation when it is called', function(){
        var someFn = function(n){
                return n + 1;
            },
            stub;
       stub = spyOn(someFn).and.return(1);
       stub(100);
       expect(stub).toHaveReturned(1);
       stub.and.callActual();
       stub(100);
       expect(stub).toHaveReturned(101);
    });
});
```

## Fakes
**_Fakes_** are _stubs_ (and therefore also _spies_) with fake implementations that can be used as substitutes for _expensive_ dependencies. **_Fakes__** are created using the _and_ API.

## Fakes API

### **_and.callFake_** *and.callFake(fn)*
Creates a fake with **_fn_** as its implementation.

```javascript
describe('Calling and.callFake(fn)', function(){
    it('creates a fake with fn as its implementation', function(){
        var someObject = {
                someExpensiveProcess: function(){
                    .
                    .
                    .
                    return true;
                }
            };
       spyOn(someObject, 'someExpensiveProcess').and.callFake(function(){return true;});
       someObject.someExpensiveProcess();
       expect(someObject.someExpensiveProcess).toHaveReturned(true);
    });
});
```

## Mocks
**_Mocks_** are _stubs_ (and therefore also _spies_) that have predefined expectations and are used to validate behaviors. Add predefined expectations to mocks using the _and.expect.it_ API and validate mocks by calling _aMock.validate()_. A _spec_ fails if _aMock.validate()_ fails.

## Mocks API

### **_and.expect.it.toBeCalled_** *and.expect.it.toBeCalled()*
Sets the expectation that the _mock_ must be called.

```javascript
describe('Calling and.expect.it.toBeCalled()', function(){
    it('sets the expectation that the mock must be called', function(){
        var aMock = spyOn().and.expect.it.toBeCalled();
        aMock();
        aMock.validate();
    });
});
```

### **_and.expect.it.toBeCalledWith_** *and.expect.it.toBeCalledWith(...args)*
Sets the expectation that the _mock_ must be called with specific arguments **_...args_**.

```javascript
describe('Calling and.expect.it.toBeCalledWith(...args)', function(){
    it('sets the expectation that the mock must be called with ...args', function(){
        var aMock = spyOn().and.expect.it.toBeCalledWith('abc', 123, {zip: '55555'});
        aMock('abc', 123, {zip: '55555'});
        aMock.validate();
    });
});
```

### **_and.expect.it.toBeCalledWithContext_** *and.expect.it.toBeCalledWithContext(object)*
Set the expectation that the _mock_ will be called with its context set to **_object_**.

```javascript
describe('Calling and.expect.it.toBeCalledWithContext(object)', function(){
    it('sets the expectation that the mock must be called with its context set to object', function(){
        var someObject = {
                someFn: function(){return this.sayHi();},
                sayHi: function(){return 'Hello';}
            },
            someOtherObject = {
                sayHi: function(){return 'Hello World!';}
            };
        spyOn(someObject, 'someFn').
            and.callActual().
            and.expect.it.toBeCalledWithContext(someOtherObject).
            and.expect.it.toReturn('Hello World!');
        someObject.someFn.call(someOtherObject);
        someObject.someFn.validate();
    });
});
```

### **_and.expect.it.toReturn_** *and.expect.it.toReturn(value)*
Set the expectation that the _mock_ will return **_value_**.

```javascript
describe('Calling and.expect.it.toReturn(value)', function(){
    it('sets the expectation that the mock must return value', function(){
        var someObject = {
                someFn: function(){return {fName: 'Tom', lName: 'Sawyer'};}
            };
        spyOn(someObject, 'someFn').and.callActual().
            and.expect.it.toReturn({fName: 'Tom', lName: 'Sawyer'});
        someObject.someFn();
        someObject.someFn.validate();
    });
});
```

### **_and.expect.it.toThrow_** *and.expect.it.toThrow()*
Set the expectation that the _mock_ must throw an exception when called.

```javascript
describe('Calling and.expect.it.toThrow()', function(){
    it('sets the expectation that the mock must throw an exception when called', function(){
        var someObject = {
                someFn: function(){ throw new Error('Whoops!');}
            };
        spyOn(someObject, 'someFn').and.callActual().
            and.expect.it.toThrow();
        someObject.someFn();
        someObject.someFn.validate();
    });
});
```

### **_and.expect.it.toThrowWithName_** *and.expect.it.toThrowWithName(name)*
Set the expectation that the _mock_ must throw an exception with **_name_** when called.

```javascript
describe('Calling and.expect.it.toThrowWithName(name)', function(){
    it('sets the expectation that the mock must throw an exception with name when called', function(){
        var someObject = {
                someFn: function(){}
            };
        spyOn(someObject, 'someFn').and.throwWithName('Error').
            and.expect.it.toThrowWithName('Error');
        someObject.someFn();
        someObject.someFn.validate();
    });
});
```

### **_and.expect.it.toThrowWithMessage_** *and.expect.it.toThrowWithMessage(message)*
Set the expectation that the _mock_ must throw an exception with **_message_** when called.

```javascript
describe('Calling and.expect.it.toThrowWithMessage(message)', function(){
    it('sets the expectation that the mock must throw an exception with message when called', function(){
        var someObject = {
                someFn: function(){}
            };
        spyOn(someObject, 'someFn').and.throwWithMessage('Whoops!').
            and.expect.it.toThrowWithMessage('Whoops!'); someObject.someFn();
        someObject.someFn.validate();
    });
});
```

## UI Tests
Preamble adds the _div element_ with the default id of _**ui-test-container**_ to the DOM. Use of this element is reserved specifically for UI tests and Preamble itself never adds content to it nor does it ever modify its content. This element's _ID_ can be overridden via configuration (please see **Configuration** below).

### getUiTestContainerElement()
Returns the UI test container DOM element.

```javascript
var uiTestContainerElement = getUiTestContainerElement();
```

### getUiTestContainerElementId()
Returns the id of the UI test container DOM element.

```javascript
var elUiTestContainerElement = document.getElementById(getUiTestContainerElementId());
```

## Configuration Using preamble-config.js
The following configuration options can be overridden in the _**preamble-config.js**_ file located in the _javascripts_ folder:

### **windowGlobals**
Default value = true. Set to false if you don't want to pollute the global name space and instead want to use the one global variable 'Preamble'.

### **timeoutInterval**
Default value = 50 milliseconds. This is the value Preamble uses to wait for a spec to complete. This value includes the time allocated to setup (beforeEach), teardown (afterEach) and the actual spec.

### **name**
Default value = 'Test'. Override this to display a meaningful _name_ for your suite in the output report.

### **uiTestContainerId**
Default value = 'ui-test-container'. Override this to use a different ID for the UI test container DOM element.

### **hidePassedTests**
Default value = false. Set it to true to hide passed specs.

### **shortCircuit** <span class="added"><small>v2.1.0</small></span>
Default value = false. Set it to true to instruct Preamble to terminate running any further specs upon the first spec failure. This is a convenient option to use if your suites take a long time to run.

## In-line Configuration
Begining with v2.0, you can call _**configure**_ directly from within your test scripts.

### **configure** *configure(hash)*
Call _**configure**_ passing a _**hash**_ containing the _properties_ and their associated _values_ for the configuration options to be overriden (see **_Configuration Using preamble-config.js_** above for descriptions of all the available configuration options).
<p class="warning">Place the call to <em>configure</em> at the very <strong><em>top</em></strong> of your test script file.</p>
<p class="warning">Please note that the <em><strong>windowGlobals</strong></em> configuration option can only be overriden by setting its value in the <em>preamble-config.js</em> configuration file and that it cannot be overriden using <em>in-line</em> configuration. Please see <em>Configuration Using preamble-config.js</em> above.</p>

```javascript
//Place the call to configure at the top of your test script file

configure({
    name: 'Sample Suite',
    hidePassedTests: true,
    timeoutInterval: 100
});

.
.
.
```

## Running Headless With PhantomJS

<p class="warning">Please note that since v2 Preamble requires PhantomJS v2.0.0 or better.</p>
<p class="warning">Please note that if you are installing the PhantomJS v2 <em>binary distribution</em> on a Mac you may need to follow the directions given <a href="https://github.com/ariya/phantomjs/issues/12900#issuecomment-74073057" target="_blank">here</a>.</p>
You can run Preamble _headless_ using <a href="http://phantomjs.org" target="_blank">PhantomJS</a>. The following example assumes that you already have PhantomJS installed and that it can be found on the path.

1. Open up a terminal and change to your test's root folder.
2. From the command line enter _"path/to/phantomjs javascripts/phantom-runner.js index.html"_ which should produce output similar to the example below:
![PhantomJS Output]({{site.baseurl}}/images/phantomjs-output.jpg)
