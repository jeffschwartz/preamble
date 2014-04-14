### A JavaScript Testing Framework ###

Preamble is a powerful Test Driven Development framework for JavaScript written in JavaScript. Preamble runs in any modern HTML5 compliant browser as well as headless via PhantomJS and has no additional dependencies on any other libraries. Preamble is backed by a very powerful assertion engine that your test scripts interface with through a very simple to use but powerful API, which makes the task of authoring tests very easy, intuitive and fun.

Documentation lives here: http://jeffschwartz.github.io/preamble/

Join the discussion here: https://groups.google.com/forum/#!forum/preamble-users/

#### Prending v2 Release Notes
This release introduces several new features as well as numerous changes to the
code base.

1) Optimized, restructured and reorganized code base to provide better 
implementations, performance and ease of maintainability for the internal 
processes that Preamble performs while running tests. Also, new internal 
functionality has been added that will allow Preamble to operate and communicate
with external processes, such as Karma, in future releases. A breaking change 
was introduced to the layout in index.html (see item 9 below), which was 
necessary to support in-line configuration. *IMPORTANT - PLEASE UPDATE EXISTING 
PROJECTS TO USE THE NEW INDEX.HTML FILE INCLUDED IN THIS RELEASE.  

2) Implemented on/off/emit. Using it internally to drive tests and will be 
used in future releases for supporting Karma adapter and other external 
processes that require additional adapters. Event handlers are called 
asynchronously for improved performance.

3) Improved the reporting accuracy of the timing statistics by excluding the
elapsed times that are due to the latency from overhead (all the code that 
isn't specifically test related, such as latency incurred waiting for the 
queue to stabilize and when transitioning between test life-cycle states).

4) Reduced the latency incurred for determining when the queue has stabilized
by decreasing the delay from 500 milliseconds to 1 millisecond.

5) Added "Total elapsed time" to the report summary, which includes latency. 
See item 3 above for more information.

6) Added in-line configuration support. Tests can now configure themselves 
by including a call to either Preamble.configure or configure with a hash 
of configuration options, which will override the default configuration as 
well as any configuration options that may have been set if 
preamble-config.js was used. *IMPORTANT - USING IN-LINE CONFIGURATION TO 
OVERRIDE THE "windowGlobals" OPTION IS NOT SUPPORTED.

7) Added the showing of stack traces for all failed assertions for all 
browsers that publish either 'stack' or 'stacktrace' properties on thrown 
Error objects.

8) Added 'Hide Passed Groups' feature, including a "hidePassedGroups" 
configuration property, which defaults to "false" and a check box to 
override the configuration.

9) Added outer wrapper div, id "preamble-ui-container", to index.html. Using
it to wrap &ltdiv id="ui-test-container" class="ui-test-container"&gt. This was 
required in order to support in-line configuration (see item 1 above). 

10) Display timings for groups and tests in details report.

#### Open Source
Preamble Is Distributed Under The MIT Software License.

Please support the effort by providing bug reports, feedback, and enhancement requests on [GitHub](https://github.com/jeffschwartz/preamble/issues?page=1&state=open).
