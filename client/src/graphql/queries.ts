import { gql } from '@apollo/client/core';

// Auth
export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      createdAt
    }
  }
`;

// Workspaces
export const MY_WORKSPACES_QUERY = gql`
  query MyWorkspaces {
    myWorkspaces {
      id
      title
      description
      createdAt
      updatedAt
    }
  }
`;

export const WORKSPACE_QUERY = gql`
  query Workspace($id: ID!) {
    workspace(id: $id) {
      id
      title
      description
      createdAt
      updatedAt
      columns {
        id
        title
        order
        cards {
          id
          title
          cardType
          checked
          order
          createdAt
          videoUrl
          videoPreview
          videoDuration
          videoSource
          noteContent
          checklistItems {
            id
            text
            checked
          }
        }
      }
      backlogItems {
        id
        title
        type
        url
        content
        done
        meta
        createdAt
      }
    }
  }
`;

// Library
export const LIBRARY_QUERY = gql`
  query Library($filter: LibraryFilter) {
    library(filter: $filter) {
      id
      title
      type
      url
      content
      status
      done
      meta
      createdAt
      updatedAt
    }
  }
`;

export const SEARCH_ITEMS_QUERY = gql`
  query SearchItems($query: String!) {
    searchItems(query: $query) {
      id
      title
      type
      url
      done
      workspace {
        id
        title
      }
    }
  }
`;
