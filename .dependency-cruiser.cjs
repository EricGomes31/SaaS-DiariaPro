/**
 * Architecture boundary rules for this app's specific shape:
 * no router, App.jsx owns all state and Supabase I/O, data is prop-drilled
 * down through feature folders under src/components/<Feature>/.
 *
 * Kept intentionally small — rules only cover boundaries actually verified
 * as currently respected (see the "no-*-into-*" rules below); add more once
 * a real violation shows a boundary is worth enforcing, rather than
 * guessing rules upfront and generating false-positive noise.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular imports make load order and side effects hard to reason about.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'ui-primitives-stay-generic',
      severity: 'error',
      comment: 'src/components/UI/** are generic, reusable primitives (SearchableSelect, Toast, LoadingScreen). ' + 'They must not depend on a specific feature, on the data layer, or on App.jsx — otherwise they stop being reusable.',
      from: { path: '^src/components/UI' },
      to: {
        path: '^src/(components/(?!UI)|lib/|App\\.jsx$)',
      },
    },
    {
      name: 'mockdata-stays-pure',
      severity: 'error',
      comment: 'src/data/mockData.js is documented (CLAUDE.md) as the pure calculation/constants module — ' + 'no React, no components, no I/O. Keep it that way so the rate/stat logic stays trivially testable.',
      from: { path: '^src/data/mockData\\.js$' },
      to: { path: '^src/(components|lib|hooks)' },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    exclude: {
      path: ['node_modules', 'dist', 'supabase/functions'],
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
}
