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
      icon
      pinned
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
      icon
      createdAt
      updatedAt
      tools {
        id
        createdAt
        updatedAt
        ownerId
        workspaceId
        title
        link
        description
        icon
        tags
      }
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
          learningStatus
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
        learningStatus
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
      learningStatus
      workspace {
        id
        title
        icon
      }
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
      learningStatus
    }
  }
`;

export const USER_STATS_QUERY = gql`
  query UserStats($userId: ID!) {
    userStats(userId: $userId) {
      id
      avatarUrl
      totalCompletedCards
      workspaceStats {
        id
        title
        description
        icon
        totalCards
        completedCards
      }
    }
  }
`;

export const TOOLS_QUERY = gql`
  query Tools($workspaceId: ID) {
    tools(workspaceId: $workspaceId) {
      id
      createdAt
      updatedAt
      ownerId
      workspaceId
      title
      link
      description
      icon
      tags
    }
  }
`;
