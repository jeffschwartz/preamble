/* jslint eqeq: true */
/* jshint strict: false */
/* global configure, describe, beforeEach, afterEach, it, -getUiTestContainerElement, -getUiTestContainerElementId, equal, isTrue */

/*
 *IMPORTANT: Please note that for the purpose of providing thoughtful examples
 *some of the following tests are coded to intentionally fail.
 */

/**
 * inline configuration
 */
configure({
    name: 'Sample Failures Test Suite',
    hidePassedTests: true,
    testTimeOutInterval: 500
});

describe('Running a test', function(){
    it('and it passes it looks like this', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!');
    });
    it('and if it fails it looks like this', function(){
        isTrue(false);
    });
});

describe('A nested test fails', function(){
    it('a passing test looks like this', function(){
        equal(1, 1);
    });
    describe('and all parent groups are marked as having failed', function(){
        it('even if they contain passing tests as this one', function(){
            equal(1,1);
        });
        describe('it is nested', function(){
            it('it looks like this', function(){
                equal(1, 0);
            });
        });
    });
});

/**
 * This test will take 1000 miliseconds to run but the test will
 * time out and fail because asyncTestDelay is set above to 500.
 */
describe('A long running test that fails to complete on time', function(){
    var count = 0;
    it('will time out and marked as having failed', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1000);
    });
});

/**
 * This is the same test as above but here the tests sets its
 * time out interval to 1010 miliseconds to prevent it from
 * timing out and failing.
 * This is a very good way to fine tune individual test but...
 * IMPORTANT: you can override asyncTestDelay in your in-line
 * configuration or in your configuration file and it will
 * apply to all tests.
 */
describe('A long running test can change how long its timeout interval is', function(){
    var count = 0;
    it('so it will not time out and fail.', 1010, function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                equal(count, 100);
            });
        }, 1000);
    });
});

describe('A long running asynchronous before process that fails to complete on time', function(){
    beforeEach(function(done){
        var self = this;
        setTimeout(function(){
            self.count = 100;
            done();
        }, 1000);
    });
    it('will time out and the test will be marked as having failed', function(){
        equal(this.count, 100);
    });
});

describe('A test can configure long running asynchronous before processes not to time out and fail', function(){
    beforeEach(function(done){
        var self = this;
        setTimeout(function(){
            self.count = 100;
            done();
        }, 1000);
    });
    it('by passing a time out interval', 1010, function(){
        equal(this.count, 100);
    });
});

describe('A long running asynchronous after process that fails to complete on time', function(){
    beforeEach(function(){
        this.count = 100;
    });
    afterEach(function(done){
        setTimeout(function(){
            done();
        }, 1000);
    });
    it('will time out and the test will be marked as having failed', function(){
        equal(this.count, 100);
    });
    it('count should still be 100', function(){
        equal(this.count, 100);
    });
});

describe('A test can configure long running asynchronous after processes not to time out and fail', function(){
    beforeEach(function(){
        this.count = 100;
    });
    afterEach(function(done){
        setTimeout(function(){
            done();
        }, 1000);
    });
    it('by passing a time out interval', 1050, function(){
        equal(this.count, 100);
    });
    it('count should be reset to 100', 1050, function(){
        equal(this.count, 100);
    });
});
