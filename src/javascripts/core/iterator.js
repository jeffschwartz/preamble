(function(){
    'use strict';

    /**
     * An iterator for iterating over arrays.
     * @param {array} this.argArray The array to be iterated over.
     */
    function Iterator(argArray){
        if(!(this instanceof Iterator)){
            return new Iterator(argArray);
        }
        if(!Array.isArray(argArray)){
            throw new Error('Iterator expects an array.');
        }
        this.argArray = argArray;
        this.currentIndex = -1;
    }

    Iterator.prototype.hasNext = function(){
        if(this.argArray.length && this.currentIndex + 1 < this.argArray
            .length){
            return true;
        } else {
            return false;
        }
    };

    Iterator.prototype.next = function(){
        if(this.hasNext()){
            this.currentIndex++;
            return true;
        } else {
            return false;
        }
    };

    Iterator.prototype.get = function(){
        return this.argArray.length && this.currentIndex >= 0 &&
            this.currentIndex <
            this.argArray.length && this.argArray[this.currentIndex];
    };

    Iterator.prototype.getNext = function(){
        if(this.next()){
            return this.get();
        }
    };

    Iterator.prototype.peekForward = function(){
        if(this.currentIndex + 1 < this.argArray.length){
            return this.argArray[this.currentIndex + 1];
        }
    };

    Iterator.prototype.peekBackward = function(){
        return this.argArray[this.currentIndex - 1];
    };

    module.exports = Iterator;
}());
