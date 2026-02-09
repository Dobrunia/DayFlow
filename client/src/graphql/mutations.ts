import { gql } from '@apollo/client/core';

export const SIGN_UP_MUTATION = gql`
  mutation SignUp($email: String!, $password: String!) {
    signUp(email: $email, password: $password) {
      token
      user {
        id
        email
        avatarUrl
        createdAt
      }
    }
  }
`;

export const SIGN_IN_MUTATION = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      token
      user {
        id
        email
        avatarUrl
        createdAt
      }
    }
  }
`;

export const SIGN_OUT_MUTATION = gql`
  mutation SignOut {
    signOut
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($avatarUrl: String) {
    updateProfile(avatarUrl: $avatarUrl) {
      id
      email
      avatarUrl
      createdAt
    }
  }
`;

export const CREATE_WORKSPACE_MUTATION = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
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

export const UPDATE_WORKSPACE_MUTATION = gql`
  mutation UpdateWorkspace($id: ID!, $input: UpdateWorkspaceInput!) {
    updateWorkspace(id: $id, input: $input) {
      id
      title
      description
      icon
    }
  }
`;

export const DELETE_WORKSPACE_MUTATION = gql`
  mutation DeleteWorkspace($id: ID!) {
    deleteWorkspace(id: $id)
  }
`;

export const TOGGLE_WORKSPACE_PINNED_MUTATION = gql`
  mutation ToggleWorkspacePinned($id: ID!) {
    toggleWorkspacePinned(id: $id) {
      id
      pinned
    }
  }
`;

export const CREATE_COLUMN_MUTATION = gql`
  mutation CreateColumn($workspaceId: ID!, $title: String!) {
    createColumn(workspaceId: $workspaceId, title: $title) {
      id
      title
      order
    }
  }
`;

export const UPDATE_COLUMN_MUTATION = gql`
  mutation UpdateColumn($id: ID!, $title: String, $hideCompleted: Boolean) {
    updateColumn(id: $id, title: $title, hideCompleted: $hideCompleted) {
      id
      title
      hideCompleted
    }
  }
`;

export const DELETE_COLUMN_MUTATION = gql`
  mutation DeleteColumn($id: ID!) {
    deleteColumn(id: $id)
  }
`;

export const REORDER_COLUMNS_MUTATION = gql`
  mutation ReorderColumns($workspaceId: ID!, $columnIds: [ID!]!) {
    reorderColumns(workspaceId: $workspaceId, columnIds: $columnIds) {
      id
      order
    }
  }
`;

export const CREATE_CARD_MUTATION = gql`
  mutation CreateCard($input: CreateCardInput!) {
    createCard(input: $input) {
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

export const UPDATE_CARD_MUTATION = gql`
  mutation UpdateCard($id: ID!, $input: UpdateCardInput!) {
    updateCard(id: $id, input: $input) {
      id
      type
      title
      done
      payload
      tags
      learningStatus
    }
  }
`;

export const DELETE_CARD_MUTATION = gql`
  mutation DeleteCard($id: ID!) {
    deleteCard(id: $id)
  }
`;

export const MOVE_CARD_MUTATION = gql`
  mutation MoveCard($id: ID!, $columnId: ID, $order: Int!) {
    moveCard(id: $id, columnId: $columnId, order: $order) {
      id
      columnId
      order
    }
  }
`;

export const CREATE_TOOL_MUTATION = gql`
  mutation CreateTool($input: CreateToolInput!) {
    createTool(input: $input) {
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

export const UPDATE_TOOL_MUTATION = gql`
  mutation UpdateTool($id: ID!, $input: UpdateToolInput!) {
    updateTool(id: $id, input: $input) {
      id
      title
      link
      description
      icon
      tags
    }
  }
`;

export const DELETE_TOOL_MUTATION = gql`
  mutation DeleteTool($id: ID!) {
    deleteTool(id: $id)
  }
`;

// Roadmap

export const CREATE_ROADMAP_MUTATION = gql`
  mutation CreateRoadmap($workspaceId: ID!, $title: String!, $sourceText: String) {
    createRoadmap(workspaceId: $workspaceId, title: $title, sourceText: $sourceText) {
      id
      createdAt
      updatedAt
      title
      sourceText
      workspaceId
    }
  }
`;

export const DELETE_ROADMAP_MUTATION = gql`
  mutation DeleteRoadmap($id: ID!) {
    deleteRoadmap(id: $id)
  }
`;

export const CREATE_ROADMAP_NODE_MUTATION = gql`
  mutation CreateRoadmapNode($roadmapId: ID!, $parentId: ID, $title: String!) {
    createRoadmapNode(roadmapId: $roadmapId, parentId: $parentId, title: $title) {
      id
      roadmapId
      parentId
      order
      title
      done
    }
  }
`;

export const UPDATE_ROADMAP_NODE_MUTATION = gql`
  mutation UpdateRoadmapNode($id: ID!, $title: String, $done: Boolean) {
    updateRoadmapNode(id: $id, title: $title, done: $done) {
      id
      title
      done
    }
  }
`;

export const DELETE_ROADMAP_NODE_MUTATION = gql`
  mutation DeleteRoadmapNode($id: ID!) {
    deleteRoadmapNode(id: $id)
  }
`;

export const REORDER_ROADMAP_NODES_MUTATION = gql`
  mutation ReorderRoadmapNodes($roadmapId: ID!, $parentId: ID, $nodeIds: [ID!]!) {
    reorderRoadmapNodes(roadmapId: $roadmapId, parentId: $parentId, nodeIds: $nodeIds) {
      id
      order
    }
  }
`;
