(function(){
    'use strict';

    /**
     * A group.
     * @constructor
     * @param {[Group]} parentGroups
     * @param {string} path
     * @param {string} label
     * @param {function} callback
     */
    function Group(parentGroups, id, path, label, callback){
        if(!(this instanceof Group)){
            return new Group(parentGroups, id, path, label, callback);
        }
        this.parentGroups = parentGroups.slice(0); //IMPORTANT: make a "copy" of the array
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
    Group.prototype.pathFromParentGroupLabels = function pathFromParentGroupLabels(){
        /* jshint validthis: true */
        var path;
        if(!this.parentGroups.length){
            return this.label;
        } else {
            path = this.parentGroups.reduce(function(prev, current){
                return prev === '' && current.label || prev +
                    ' ' + current.label;
            }, '');
            return path + ' ' + this.label;
        }
    };

    module.exports = Group;
}());
