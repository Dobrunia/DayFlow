import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ErrorCodes } from '@/lib/graphql-error';

// Dev: use /graphql (Vite proxy → localhost:4000). Prod: set VITE_GRAPHQL_URL in .env
const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? '/graphql';

let onUnauthorized: (() => void) | null = null;

/** Вызывать из main.ts после Pinia и router — при 401 с бэка разлогин + редирект на /auth */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

/** Token is hex string from server — only ASCII allowed in HTTP headers */
function isValidToken(token: string): boolean {
  return /^[a-f0-9]+$/i.test(token);
}

/** Remove bad token and kick user to /auth */
function clearSession() {
  localStorage.removeItem('df_sid');
  onUnauthorized?.();
}

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (networkError) {
    // Bad token / network issue — clear and redirect silently
    clearSession();
    return;
  }
  const hasUnauth = graphQLErrors?.some(
    (err) => (err.extensions?.code as string) === ErrorCodes.UNAUTHENTICATED
  );
  if (hasUnauth) clearSession();
});

// Auth via Bearer token from localStorage
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('df_sid');
  const valid = token && isValidToken(token);
  if (token && !valid) {
    // Corrupted token — remove immediately
    localStorage.removeItem('df_sid');
  }
  return {
    headers: {
      ...headers,
      ...(valid ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const httpLink = createHttpLink({
  uri: graphqlUrl,
  // credentials: 'include', — cookies disabled, auth via Bearer token only
});

export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink).concat(httpLink),
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
          backlog: {
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
