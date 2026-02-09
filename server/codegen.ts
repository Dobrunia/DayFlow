import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/schema/**/*.graphql',
  generates: {
    'src/generated/types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../lib/context#Context',
        mappers: {
          User: '@prisma/client#User as UserModel',
          Workspace: '@prisma/client#Workspace as WorkspaceModel',
          Column: '@prisma/client#Column as ColumnModel',
          Card: '@prisma/client#Card as CardModel',
        },
        enumsAsTypes: true,
        useIndexSignature: true,
      },
    },
  },
};

export default config;
