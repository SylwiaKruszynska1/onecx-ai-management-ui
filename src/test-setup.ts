// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true
  }
}

// Suppress CSS stylesheet parsing errors
const originalConsoleError = console.error
console.error = function (...data) {
  if (typeof data[0]?.toString === 'function' && data[0].toString().includes('Error: Could not parse CSS stylesheet')) {
    return
  }
  originalConsoleError(...data)
}

import 'jest-preset-angular/setup-jest'
