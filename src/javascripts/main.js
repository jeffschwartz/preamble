//Preamble v3.0.3)
//(c) 2013 - 2015 Jeffrey Schwartz
//Preamble may be freely distributed under the MIT license.
(function(){
    'use strict';

    //Version
    var emit = require('./core/emit.js'),
        runner = require('./core/runner.js'),
        configure = require('./core/configure.js'),
        globals = require('./core/globals.js'),
        helpers = require('./core/helpers.js'),
        prevQueueCount = 0,
        queueStableCount = 0,
        queueStableInterval = 1,
        intervalId;

    /**
     *                              It all starts here!
     */

    /**
     * Initialize internal events
     */
    runner.init();

    /**
     * Configure the runtime environment.
     */
    configure();

    /**
     * Wait while the queue is built as scripts call group function.
     * Keep checking the queue's length until it is 'stable'.
     * Keep checking that config.autoStart is true.
     * Stable is defined by a time interval during which the length
     * of the queue remains constant, indicating that all groups
     * have been loaded. Once stable, emit the 'start' event.
     * ***Note: config.autoStart can only be false if it set by an
     * external process (e.g. Karma adapter).
     */
    try {
        //TODO(Jeff): handle a missing test script
        intervalId = setInterval(function(){
            if(globals.queue.length === prevQueueCount){
                if(queueStableCount > 1 && globals.config.autoStart){
                    clearInterval(intervalId);
                    //Run!
                    emit('start');
                } else {
                    queueStableCount++;
                }
            } else {
                queueStableCount = 0;
                prevQueueCount = globals.queue.length;
            }
        }, queueStableInterval);
    } catch (e){
        helpers.errorHandler(e);
    }
}());
