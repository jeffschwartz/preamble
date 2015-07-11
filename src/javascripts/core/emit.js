(function(){
    'use strict';
    var pubsub = require('./pubsub.js');

    //Convenience method for emiting and event.
    module.exports = function emit(topic, data){
        if(data){
            pubsub.emit(topic, data);
        } else {
            pubsub.emit(topic);
        }
    };
}());
