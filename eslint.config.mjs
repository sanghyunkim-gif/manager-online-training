import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  // Next.js 권장 설정 (core-web-vitals + TypeScript)
  ...nextVitals,
  ...nextTs,

  // 프로젝트 강제 규칙
  {
    rules: {
      // any 타입 금지 (unknown + type guard 사용)
      '@typescript-eslint/no-explicit-any': 'error',
      // console.log / console.debug 금지 — console.warn / console.error만 허용
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // useEffect 의존성 배열 누락 금지
      'react-hooks/exhaustive-deps': 'error',
      // useEffect 내 동기 setState는 특정 패턴(조건부 early return)에서 허용
      // (React 19 + eslint-plugin-react-hooks v5 신규 규칙: 기존 코드 호환을 위해 warn으로 완화)
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // 빌드 산출물 및 불필요한 경로 제외
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'vendor/**']),
]);

export default eslintConfig;
