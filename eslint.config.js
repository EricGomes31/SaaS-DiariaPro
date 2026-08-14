import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // Não lintar build, deps nem as Edge Functions (são Deno, ambiente diferente).
  { ignores: ['dist/**', 'node_modules/**', 'supabase/functions/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // browser + node cobre tanto o app quanto vite.config.js sem falsos positivos de global.
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,

      // Regras clássicas de hooks. Não uso o "recommended" do react-hooks v7 porque ele
      // embute o conjunto experimental do React Compiler (purity, set-state-in-effect),
      // que gera falso positivo (ex.: Date.now() num event handler) e foge do objetivo.
      'react-hooks/rules-of-hooks': 'error',
      // Desligado: os efeitos do app gerenciam dependências à mão (refs de sync,
      // showToast/loadData estáveis). A regra só geraria falso positivo aqui.
      'react-hooks/exhaustive-deps': 'off',

      // Novo transform JSX (Vite): não precisa "import React".
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Marca componentes usados em JSX como "usados" (senão no-unused-vars daria falso positivo).
      'react/jsx-uses-vars': 'error',

      // no-undef (de js/recommended) é o que pega "código quebrado": variável/função indefinida.
      // Variáveis não usadas viram aviso (ajuda a achar código morto), ignorando MAIÚSCULAS e _prefix.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],

      // Ruído de DX que não indica bug — desligado para focar em problemas reais.
      'react-refresh/only-export-components': 'off',
    },
  },
]
