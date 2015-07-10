(function(){
    'use strict';
    var compare = require('../helpers.js').compare;

    function a_equals_b(a, b){
        if(typeof a === 'object' && typeof b === 'object'){
            //Both are object so compare their properties.
            if(compare(a, b)){
                return true;
            }
        }
        if(typeof a === 'object' || typeof b === 'object'){
            //One is an object and the other isn't.
            return false;
        }
        //Both are not object so just compare values.
        return a === b;
    }

    function a_notequals_b(a, b){
        return !a_equals_b(a, b);
    }

    //Simple boolean test.
    function a_equals_true(a){
        return a === true;
    }

    //Simple boolean test.
    function a_equals_false(a){
        return a === false;
    }

    //Simple boolean test.
    function a_is_truthy(a){
        return (a);
    }

    //Simple boolean test.
    function a_is_not_truthy(a){
        return (!a);
    }

    exports.a_equals_b = a_equals_b;
    exports.a_notequals_b = a_notequals_b;
    exports.a_equals_true = a_equals_true;
    exports.a_equals_false = a_equals_false;
    exports.a_is_truthy = a_is_truthy;
    exports.a_is_not_truthy = a_is_not_truthy;
}());
