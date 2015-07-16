/**
 * Configuration is called once internally but may be called again if test script
 * employs in-line configuration.
 */
(function(){
    'use strict';

    module.exports = function configure(){
        /**
         * Default configuration options - override these in your config file
         * (e.g. var preambleConfig = {timeoutInterval: 10}) or in-line in your tests.
         *
         * windowGlobals: (default true) - set to false to not use window globals
         * (i.e. non browser environment). *IMPORTANT - USING IN-LINE CONFIGURATION
         * TO OVERRIDE THE "windowGlobals" OPTION IS NOT SUPPORTED*.
         *
         * timeoutInterval: (default 50 milliseconds) - set to some other number
         * of milliseconds to wait before a test is timed out. This number is applied
         * to all tests and can be selectively overridden by individual tests.
         *
         * name: (default 'Suite') - set to a meaningful name.
         *
         * uiTestContainerId (default id="ui-test-container") - set its id to something
         * else if desired.
         *
         * hidePassedTests: (default: false) - set to true to hide passed tests.
         *
         * shortCircuit: (default: false) - set to true to short circuit when a test fails.
         *
         * testingShortCircuited: (default: false) - *IMPORTANT - FOR INTERNAL USE ONLY*
         * When a test fails and shortCircuit is set to true then Preamble will set this
         * to true.
         *
         * autoStart: (default: true) - *IMPORTANT - FOR INTERNAL USE ONLY* Adapters
         * for external processes, such as for Karma, initially set this to false to
         * delay the execution of the tests and will eventually set it to true when
         * appropriate.
         */
        var defaultConfig = {
                windowGlobals: true,
                timeoutInterval: 50,
                name: 'Suite',
                uiTestContainerId: 'ui-test-container',
                hidePassedTests: false, //TODO(J.S.): rename this to hidePassed
                shortCircuit: false,
                testingShortCircuited: false,
                autoStart: true
            },
            HtmlReporter = require('../reporters/htmlreporter.js'),
            emit = require('./emit.js'),
            ExpectationApi = require('./expectationapi.js'),
            configArg = arguments && arguments[0],
            notations = require('./expectations/notations.js'),
            spyOn = require('./spy.js'),
            queueBuilder = require('./queuebuilder.js'),
            globals = require('./globals.js'),
            helpers = require('./helpers.js');

        //Ignore configuration once testing has started.
        if(configArg && globals.queue.length){
            return;
        }
        globals.config = window.preambleConfig ? helpers.merge(defaultConfig, window.preambleConfig) :
            defaultConfig;
        globals.config = configArg ? helpers.merge(globals.config, configArg) : globals.config;
        //Capture run-time filters, if any.
        globals.runtimeFilter = {
            suite: helpers.loadPageVar('suite'),
            spec: helpers.loadPageVar('spec')
        };
        //Capture exception's stack trace property.
        helpers.setStackTraceProperty();
        //Handle global errors.
        window.onerror = helpers.errorHandler;
        //If the windowGlabals config option is false then window globals will
        //not be used and the one Preamble name space will be used instead.
        if(globals.config.windowGlobals){
            window.configure = configure;
            window.describe = queueBuilder.group;
            window.beforeEach = queueBuilder.beforeEachSpec;
            window.afterEach = queueBuilder.afterEachSpec;
            window.it = queueBuilder.test;
            window.expect = notations.noteExpectation;
            window.getUiTestContainerElement = helpers.getUiTestContainerElement;
            window.getUiTestContainerElementId = helpers.getUiTestContainerElementId;
            window.spyOn = spyOn;
        } else {
            window.Preamble = {
                configure: configure,
                describe: queueBuilder.group,
                beforeEach: queueBuilder.beforeEachSpec,
                afterEach: queueBuilder.afterEachSpec,
                it: queueBuilder.test,
                expect: notations.noteExpectation,
                getUiTestContainerElement: helpers.getUiTestContainerElement,
                getUiTestContainerElementId: helpers.getUiTestContainerElementId,
                spyOn: spyOn,
            };
        }
        globals.expectationApi = new ExpectationApi();
        window.Preamble = window.Preamble || {};
        //For use by external processes.
        window.Preamble.__ext__ = {};
        //Expose config options to external processes.
        window.Preamble.__ext__.config = globals.config;
        //Record the start time.
        globals.queue.start = Date.now();
        //Create a reporter.
        globals.reporter = new HtmlReporter();
        //publish config event.
        emit('configchanged', {
            name: globals.config.name, uiTestContainerId: globals.config.uiTestContainerId
        });
    };
}());
