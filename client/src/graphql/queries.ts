import { gql } from '@apollo/client/core';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      avatarUrl
      createdAt
    }
  }
`;

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
          createdAt
          updatedAt
          ownerId
          workspaceId
          columnId
          order
          type
          title
          done
          payload
          tags
        }
      }
      backlog {
        id
        createdAt
        updatedAt
        ownerId
        workspaceId
        columnId
        order
        type
        title
        done
        payload
        tags
      }
    }
  }
`;

export const CARDS_QUERY = gql`
  query Cards($filter: CardFilter) {
    cards(filter: $filter) {
      id
      createdAt
      updatedAt
      ownerId
      workspaceId
      columnId
      order
      type
      title
      done
      payload
      tags
    }
  }
`;

export const CARD_QUERY = gql`
  query Card($id: ID!) {
    card(id: $id) {
      id
      createdAt
      updatedAt
      ownerId
      workspaceId
      columnId
      order
      type
      title
      done
      payload
      tags
    }
  }
`;
