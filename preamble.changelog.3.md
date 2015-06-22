---
layout: page
title: v3 Changelog
permalink: /preamble/changelog/3/
---

## Changes

### v3.0.3
#### Enhancements
* When calling **_expect(fn)_**, where _fn_ is a function but not a _spy_, _fn_
is first converted to a _spy_, then the _spy_ is called, and then the actual
value is set to the _spy_.

### v3.0.2
#### Bug Fixes
* Fixes an eroneous suite in sample-suite.js only. No changes to preamble.js
itself were made. You can ignore this if you aren't concerned with the content
of sample-suite.js having changed. Documentation also updated to reflect this
change.

### v3.0.1
#### Bug Fixes
* Fixes ACall.prototype.hasArgPropety and Args.hasArgProperty methods.

### v3.0.0
#### Enhancements
* BDD all the way!
* Enhanced support for test doubles: spies, stubs, fakes and mocks.
