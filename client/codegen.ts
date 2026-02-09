import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../server/src/schema/schema.graphql',
  documents: 'src/graphql/**/*.ts',
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        enumsAsTypes: true,
        maybeValue: 'T | null',
      },
    },
  },
};

export default config;
