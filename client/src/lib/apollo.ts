import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { ErrorCodes } from '@/lib/graphql-error';

// Dev: use /graphql (Vite proxy → localhost:4000). Prod: set VITE_GRAPHQL_URL in .env
const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? '/graphql';

let onUnauthorized: (() => void) | null = null;

/** Вызывать из main.ts после Pinia и router — при 401 с бэка разлогин + редирект на /auth */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  const hasUnauth = graphQLErrors?.some(
    (err) => (err.extensions?.code as string) === ErrorCodes.UNAUTHENTICATED
  );
  if (hasUnauth) onUnauthorized?.();
  return forward(operation);
});

const httpLink = createHttpLink({
  uri: graphqlUrl,
  credentials: 'include',
});

export const apolloClient = new ApolloClient({
  link: errorLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          library: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          myWorkspaces: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Workspace: {
        fields: {
          columns: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Column: {
        fields: {
          cards: {
            merge(_existing, incoming) {
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
