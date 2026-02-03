import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';

// Dev: use /graphql (Vite proxy → localhost:4000). Prod: set VITE_GRAPHQL_URL in .env
const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? '/graphql';

const httpLink = createHttpLink({
  uri: graphqlUrl,
  credentials: 'include',
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          library: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          myWorkspaces: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Workspace: {
        fields: {
          columns: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Column: {
        fields: {
          cards: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
