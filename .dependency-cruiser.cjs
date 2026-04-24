/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'This dependency is part of a circular relationship. You might want to revise your solution.',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'not-to-unresolvable',
      comment: "This module depends on a module that cannot be found.",
      severity: 'error',
      from: {},
      to: {
        couldNotResolve: true
      }
    },
    {
      name: 'foundation-must-not-depend-on-modules',
      comment: 'The foundation (framework/core) layer must not depend on any specific feature modules.',
      severity: 'error',
      from: {
        path: '^src/foundation'
      },
      to: {
        path: '^src/modules'
      }
    },
    {
      name: 'core-must-not-depend-on-modules',
      comment: 'The core (registry/interfaces) layer must not depend on any specific feature modules.',
      severity: 'error',
      from: {
        path: '^src/core'
      },
      to: {
        path: '^src/modules'
      }
    },
    {
      name: 'modules-must-be-isolated',
      comment: 'Modules must not depend on each other directly. They should communicate via the core registry or foundation interfaces.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/'
      },
      to: {
        path: '^src/modules/([^/]+)/',
        pathNot: '^src/modules/$1/'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.app.json'
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"]
    }
  }
};
