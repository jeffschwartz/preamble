(function(){
    'use strict';
    var pubsub = require('./pubsub.js');

    //Convenience method for registering handlers.
    module.exports = function on(topic, handler, context){
        pubsub.on(topic, handler, context);
    };
}());
