---
layout: page
title: v1 Changelog
permalink: /preamble/changelog/1/
---

## Changes

v1.3.0 - the default config values for asyncTestDelay and asyncBeforeAfterTestDelay have been reduced from 500 milliseconds to 10 milliseconds, which significantly speeds up testing. Also status reporting and status messages have been improved.

v1.2.3 - rolls up v1.2.0 - v1.2.2.

v1.2.2 - bumped version number in preamble.js. If you are on v1.2.0 you can skip this release.

v1.2.1 - edited comments in preamble.js, specifically in regard to proxy. If you are on v1.2.0 you can skip this release.

v1.2.0 - proxy completely rewritten and its API simplified. proxy can now spy on property methods and now also notes the context when the wrapped function is called.

v1.1.1 - bug fix for proxy.getArgsPassed(index) which would throw an exception if argsPassed was undefined. Added check for undefined.

v1.1.0 - introduces a simpler calling converntion for proxy, removing one level of indirection. Please note that this is a breaking change. To upgrade your tests please modify your calls to proxy as follows:
