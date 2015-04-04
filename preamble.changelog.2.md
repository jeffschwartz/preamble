---
layout: page
title: v2 Changelog
permalink: /preamble/changelog/2/
---

## Changes

### v2.2.0
#### Enhancements
* Report header now remains fixed and will not scroll when scrolling Report
output.

### v2.1.0
#### Enhancements

* Short circuiting a running test suite immediately after the first test fails is now supported via the "shortCircuit" configuration property when it is set to boolean true (it defaults to boolean false).
* When running headless via PhantomJS the test suite name, coverage and duration are now displayed in the console output.

#### Bug Fixes

* Report coverage now reports the correct number of tests actually run when filtering (e.g "Ran 4 of 51 tests"). This will also report the correct number of tests run when using the new "shortCircuit" option (see Enhancements above).
* Report summary now displays "All tests passed" when there are no failures. This fixes the issue of the wrong number being reported for total tests passed when filtering.
