//Mocks define so coccyx.js can be included without RequireJS.
//Calls define's callback function allowing Coccyx's modules
//to define themselves.
//IMPORTANT - include this script before coccyx.js.
(function($){
    'use strict';
    window.define =  function define(){
        (arguments[arguments.length - 1])($);
    };
}($));
