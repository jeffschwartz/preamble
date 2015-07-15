(function(){
    'use strict';

    /**
     * A group.
     * @constructor
     * @param {[Group]} ancestorSuites
     * @param {string} path
     * @param {string} label
     * @param {function} callback
     */
    function Group(ancestorSuites, id, path, label, callback){
        if(!(this instanceof Group)){
            return new Group(ancestorSuites, id, path, label, callback);
        }
        this.ancestorSuites = ancestorSuites.slice(0); //IMPORTANT: make a "copy" of the array
        this.id = id;
        this.path = path;
        this.label = label;
        this.callback = callback;
        this.duration = 0;
        this.passed = true;
    }

    /**
     * Returns the concatenated labels from all parent groups.
     * @param {array} parents An array of parent groups.
     */
    Group.prototype.pathFromAncestorSuiteLabels = function pathFromAncestorSuiteLabels(){
        /* jshint validthis: true */
        var path;
        if(!this.ancestorSuites.length){
            return this.label;
        } else {
            path = this.ancestorSuites.reduce(function(prev, current){
                return prev === '' && current.label || prev +
                    ' ' + current.label;
            }, '');
            return path + ' ' + this.label;
        }
    };

    module.exports = Group;
}());
