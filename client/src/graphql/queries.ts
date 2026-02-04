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
  query Cards($filter: CardFilter, $limit: Int, $offset: Int, $sortOrder: String) {
    cards(filter: $filter, limit: $limit, offset: $offset, sortOrder: $sortOrder) {
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

export const CARDS_COUNT_QUERY = gql`
  query CardsCount($filter: CardFilter) {
    cardsCount(filter: $filter)
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
