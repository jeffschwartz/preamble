(function(){
    'use strict';
    var version = require('../core/version.js'),
        globals = require('../core/globals.js'),
        helpers = require('../core/helpers.js'),
        Group = require('../core/group.js');

    /**
     * Adds an event handle to a DOM element for an event in a cross-browser compliant manner.
     */
    function domAddEventHandler(el, event, handler){
        if(el.addEventListener){
            el.addEventListener(event, handler, false);
        } else {
            el.attachEvent('on' + event, handler);
        }
    }

    /**
     * HtmlReporter.
     * @constructor
     */
    function HtmlReporter(){
        var on = require('../core/on.js');

        this.hptClickHandler = this.hptClickHandler.bind(this);
        this.preambleTestContainer = document.getElementById('preamble-test-container');
        this.preambleUiContainer = document.getElementById('preamble-ui-container');
        this.init();
        on('configchanged', function(topic, args){
            //Add structure to the document and show the header.
            this.updateHeader(args.name, 'Preamble ' + version, args.uiTestContainerId);
        }, this);
    }

    /**
     * Hide/show passed tests.
     */
    HtmlReporter.prototype.showHidePassedTests = function(){
        var elUls = document.getElementsByTagName('ul'),
            i,
            ii,
            l,
            ll,
            attributes,
            elContainers = [],
            classes = '';

        for(i = 0, l = elUls.length; i < l; i++){
            attributes = elUls[i].getAttribute('class');
            if(attributes && attributes.length){
                attributes = attributes.split(' ');
                for(ii = 0, ll = attributes.length; ii < ll; ii++){
                    if(attributes[ii] === 'group-container' ||
                    attributes[ ii] === 'tests-container'){
                        elContainers.push(elUls[i]);
                    }
                }
            }
        }
        if(document.getElementById('hidePassedTests')
            .checked){
            elContainers.forEach(function(elContainer){
                if(elContainer.getAttribute('data-passed') === 'true'){
                    classes = elContainer.getAttribute('class');
                    elContainer.setAttribute('class', classes + ' hidden');
                }
            });
        } else {
            elContainers.forEach(function(elContainer){
                if(elContainer.getAttribute('data-passed') === 'true'){
                    classes = elContainer.getAttribute('class');
                    attributes = classes.split(' ');
                    classes = [];
                    attributes.forEach(function(c){
                        if(c !== 'hidden'){
                            classes.push(c);
                        }
                    });
                    elContainer.setAttribute('class', classes);
                }
            });
        }
    };

    /**
     * Click handler for the hide passed tests checkbox.
     * Stops propagation of the event and calls showhidePassedTests
     * to do the heavy lifting.
     */
    HtmlReporter.prototype.hptClickHandler = function(evt){
        evt.stopPropagation();
        this.showHidePassedTests();
    };

    /**
     * Handles all anchor tag click events which are delegated to the
     * test container element.
     * When an anchor tag is clicked, persist the hidePassedTests checkbox
     * state as a query parameter and set the window location accordingly.
     * @param {object} evt A DOM event object.
     */
    HtmlReporter.prototype.runClickHandler = function(evt){
        var checked,
            lastChar,
            href;

        //Only respond to delegated anchor tag click events.
        if(evt.target.tagName === 'A'){
            evt.stopPropagation();
            checked = document.getElementById('hidePassedTests').checked;
            if(globals.config.hidePassedTests !== checked){
                evt.preventDefault();
                href = evt.target.getAttribute('href');
                lastChar = href[href.length - 1];
                lastChar = lastChar === '?' ? '' : '&';
                window.location = href + lastChar + 'hpt=' + checked;
            }
        }
    };

    /**
     * Add structure to the DOM/show the header.
     */
    HtmlReporter.prototype.init = function(){
        var s = '<header>' +
            '<div class="banner-table">' +
            '<section id="banner">' +
            '<h1>' +
            '<span id="name">Test</span> - ' +
            '<span>' +
            '<span> ' +
            '<span>' +
            '<i id="version">{{version}}</i>' +
            '</span>' +
            '</span>' +
            '</span>' +
            '</h1>' +
            '</section>' +
            '<section id="time">' +
            '<span>Completed in ' +
            '<span title="total time to completion">' +
            '{{tt}}ms' +
            '</span>' +
            '</span>' +
            '</section>' +
            '</div>' +
            '<div class="table">' +
            '<section id="preamble-status-container">' +
            '<div class="summary">Building queue. Please wait...</div>' +
            '</section>' +
            '</div>' +
            '</header>' +
            '<div class="container">' +
            '<section id="preamble-results-container"></section>' +
            '</div>';

        s = s.replace(/{{version}}/, version);
        this.preambleTestContainer.innerHTML = s;
    };

    /**
     * Updates the header.
     * @param {string} name
     * @param {string} version
     * @param {string} uiTestContainerId
     */
    HtmlReporter.prototype.updateHeader = function(name, version, uiTestContainerId){
        document.getElementById('name').innerHTML = name;
        document.getElementById('version').innerHTML = version;
        this.preambleUiContainer.innerHTML = '<div id="{{id}}" class="ui-test-container"></div>'.
            replace(/{{id}}/, uiTestContainerId);
    };

    /**
     * Shows coverage or filtered information.
     * @param {array} tests An array of Tests.
     */
    HtmlReporter.prototype.coverage = function(tests){
        var show = 'Ran {{tt}}',
            elStatusContainer = document.getElementById('preamble-status-container'),
            coverage,
            hpt;

        //Show groups and tests coverage in the header.
        show = show.replace(/{{tt}}/, tests.length - tests.totBypassed);
        if(globals.config.testingShortCircuited){
            show += (tests.length - tests.totBypassed) && ' of {{tbpt}}';
            show = show.replace(/{{tbpt}}/, tests.length);
        } else if(globals.runtimeFilter.group){
            show += globals.runtimeFilter.group && ' of {{tbpt}}';
            show = show.replace(/{{tbpt}}/, tests.length);
        }
        show += helpers.pluralize(' spec', tests.length);
        coverage = '<div id="coverage">' + show +
            '<div class="hptui"><label for="hidePassedTests">Hide passed</label>' +
            '<input id="hidePassedTests" type="checkbox" {{checked}}></div>' +
            ' - <a id="runAll" href="?"> run all</a>' +
            '</div>';
        hpt = helpers.loadPageVar('hpt');
        hpt = hpt === '' && globals.config.hidePassedTests || hpt === 'true' &&
            true || hpt === 'false' && false;
        coverage = coverage.replace(/{{checked}}/, hpt && 'checked' || '');
        //Preserve error message that replaces 'Building queue. Please wait...'.
        if(elStatusContainer.innerHTML ===
            '<div class="summary">Building queue. Please wait...</div>'){
            elStatusContainer.innerHTML = coverage;
        } else {
            elStatusContainer.innerHTML += coverage;
        }
        document.getElementById('coverage').style.display = 'block';
    };

    /**
     * Show summary information.
     * @param {array} tests An array containing only Tests.
     */
    HtmlReporter.prototype.summary = function(tests){
        var html,
            el,
            s;

        el = document.getElementById('time');
        s = el.innerHTML;
        s = s.replace(/{{tt}}/, tests.duration);
        el.innerHTML = s;
        el.style.display = 'table-cell';
        if(tests.result){
            html = '<div id="preamble-results-summary-passed" class="summary-passed">' +
                'All specs passed' + '</div>';
        } else {
            html = '<div id="preamble-results-summary-failed" class="summary-failed">' +
                tests.totTestsFailed + helpers.pluralize(' spec', tests.totTestsFailed) +
                ' failed.</div>';
        }
        document.getElementById('preamble-status-container').insertAdjacentHTML('beforeend', html);
    };

    /**
     * Show details.
     * @param {array} tests An array of Tests.
     */
    HtmlReporter.prototype.details = function(queue){
        var rc = document.getElementById('preamble-results-container'),
            groupContainerMarkup =
                '<ul class="group-container" data-passed="{{passed}}" id="{{id}}"></ul>',
            groupAnchorMarkup =
                '<li><a class="group{{passed}}" href="?group={{grouphref}}" title="Click here to filter by this group.">{{label}}</a></li>',
            testContainerMarkup =
                '<ul class="tests-container" data-passed="{{passed}}"></ul>',
            testAnchorMarkup =
                '<li><a class="{{passed}}" href="?group={{grouphref}}&test={{testhref}}" title="Click here to filter by this test.">{{label}}</a></li>',
            testFailureMarkup =
                '<ul class="stacktrace-container failed bold"><li class="failed bold">Error: "{{explain}}" and failed at</li><li class="failed bold">{{stacktrace}}</li></ul>',
            html = '',
            failed = '',
            parentGroup,
            el;

        queue.forEach(function(item){
            if(item instanceof(Group)){
                //Add groups to the DOM.
                html = '' + groupContainerMarkup.replace(/{{passed}}/, item.passed).replace(/{{id}}/, item.path);
                html = html.slice(0, -5) + groupAnchorMarkup.replace(/{{passed}}/,
                    item.bypass ? ' bypassed' : item.passed ? '' : ' failed').replace('{{grouphref}}',
                    encodeURI(item.pathFromParentGroupLabels())).replace(/{{label}}/, item.label) + html.slice(- 5);
                html = html;
                if(!item.parentGroups.length){
                    rc.insertAdjacentHTML('beforeend', html);
                } else {
                    parentGroup = item.parentGroups[item.parentGroups.length - 1];
                    el = document.getElementById(parentGroup.path);
                    el.insertAdjacentHTML('beforeend', html);
                }
            } else {
                //Add tests to the DOM.
                html = '' + testContainerMarkup.replace(/{{passed}}/, item.totFailed ? 'false' : 'true');
                html = html.slice(0, -5) + testAnchorMarkup.replace(/{{passed}}/, item.bypass ?
                    'test-bypassed' : item.totFailed ? 'failed' : 'passed').replace('{{grouphref}}',
                    encodeURI(item.parentGroup.pathFromParentGroupLabels())).replace('{{testhref}}',
                    encodeURI(item.label)).replace(/{{label}}/, item.label) + html.slice(-5);
                //Show failed assertions and their stacks.
                if(item.totFailed > 0){
                    item.assertions.forEach(function(assertion){
                        if(!assertion.result){
                            failed = testFailureMarkup.replace(/{{explain}}/,
                                assertion.explain).replace(/{{stacktrace}}/,
                                helpers.stackTrace(assertion.stackTrace ));
                            html = html.slice(0, -5) + failed + html.slice(-5);
                        }
                    });
                } else if(item.totFailed === -1){
                    failed = testFailureMarkup.replace(/{{explain}}/,
                        'spec timed out').replace(/{{stacktrace}}/,
                        helpers.stackTrace(item.stackTrace));
                    html = html.slice(0, -5) + failed + html.slice(-5);
                }
                el = document.getElementById(item.parentGroup.path);
                el.insertAdjacentHTML('beforeend', html);
            }
        });
        this.showHidePassedTests();
        document.getElementById('preamble-results-container').style.display = 'block';
        domAddEventHandler(document.getElementById('hidePassedTests'), 'click', this.hptClickHandler);
        //Delegate all click events to the test container element.
        domAddEventHandler(document.getElementById('preamble-test-container'), 'click', this.runClickHandler);
    };

    module.exports = HtmlReporter;
}());
