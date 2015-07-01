(function(){
    'use strict';
    var notations = require('./expectations/notations.js');

    function Assert(){
        this.not = new Not();
    }

    Assert.prototype = {
        constructor: Assert,
        toEqual: notations.noteToEqualAssertion,
        toBeTrue: notations.noteToBeTrueAssertion,
        toBeTruthy: notations.noteToBeTruthyAssertion,
        toHaveBeenCalled: notations.noteToHaveBeenCalled,
        toHaveBeenCalledWith: notations.noteToHaveBeenCalledWith,
        toHaveBeenCalledWithContext: notations.noteToHaveBeenCalledWithContext,
        toHaveReturned: notations.noteToHaveReturned,
        toHaveThrown: notations.noteToHaveThrown,
        toHaveThrownWithName: notations.noteToHaveThrownWithName,
        toHaveThrownWithMessage: notations.noteToHaveThrownWithMessage
    };

    function Not(){}

    Not.prototype = {
        constructor: Not,
        toEqual: notations.noteToNotEqualAssertion,
        toBeTrue: notations.noteToBeFalseAssertion,
        toBeTruthy: notations.noteToNotBeTruthyAssertion,
        toHaveBeenCalled: notations.noteToNotHaveBeenCalled,
        toHaveBeenCalledWith: notations.noteToNotHaveBeenCalledWith,
        toHaveBeenCalledWithContext: notations.noteToNotHaveBeenCalledWithContext,
        toHaveReturned: notations.noteToNotHaveReturned,
        toHaveThrown: notations.noteToNotHaveThrown,
        toHaveThrownWithName: notations.noteToNotHaveThrownWithName,
        toHaveThrownWithMessage: notations.noteToNotHaveThrownWithMessage
    };

    module.exports = Assert;
}());
