import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/schema/**/*.graphql',
  generates: {
    'src/generated/types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../lib/context#Context',
        mappers: {
          User: '@prisma/client#User',
          Workspace: '@prisma/client#Workspace',
          Column: '@prisma/client#Column',
          Item: '@prisma/client#Item',
          Card: '@prisma/client#Card',
        },
        enumsAsTypes: true,
        useIndexSignature: true,
      },
    },
  },
};

export default config;
