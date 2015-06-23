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
* Fixes an eroneous suite in _sample-suite.js_ only. No changes to preamble.js
itself were made. **_You can ignore this release_** if you aren't concerned with
the content of sample-suite.js having changed. Documentation also updated to
reflect this change.

### v3.0.1
#### Bug Fixes
* Fixes **_ACall.prototype.hasArgPropety_** and
**_Args.prototype.hasArgProperty_** methods.

### v3.0.0
#### Enhancements
* **_BDD all the way!_**
* Enhanced support for _test doubles_: **_spies_**, **_stubs_**, **_fakes_** and
**_mocks_**.
