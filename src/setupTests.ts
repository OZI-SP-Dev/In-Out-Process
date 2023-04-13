// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

import { initializeIcons } from "@fluentui/font-icons-mdl2";
// Initialize from a location we have access to, default location is blocked so using alternate
//  see https://github.com/microsoft/fluentui/wiki/Using-icons
initializeIcons();

// Increase the timeout to 10s to prevent some overlapping issues
// Test run times are hit/miss on just barely being over the 5s threshold
//jest.setTimeout(20000);
