import { gql } from '@apollo/client/core';

// Auth
export const SIGN_UP_MUTATION = gql`
  mutation SignUp($email: String!, $password: String!) {
    signUp(email: $email, password: $password) {
      user {
        id
        email
        createdAt
      }
    }
  }
`;

export const SIGN_IN_MUTATION = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      user {
        id
        email
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

// Workspace
export const CREATE_WORKSPACE_MUTATION = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      id
      title
      description
      createdAt
    }
  }
`;

export const UPDATE_WORKSPACE_MUTATION = gql`
  mutation UpdateWorkspace($id: ID!, $input: UpdateWorkspaceInput!) {
    updateWorkspace(id: $id, input: $input) {
      id
      title
      description
    }
  }
`;

export const DELETE_WORKSPACE_MUTATION = gql`
  mutation DeleteWorkspace($id: ID!) {
    deleteWorkspace(id: $id)
  }
`;

// Column
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
  mutation UpdateColumn($id: ID!, $title: String!) {
    updateColumn(id: $id, title: $title) {
      id
      title
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

// Item
export const CREATE_ITEM_MUTATION = gql`
  mutation CreateItem($input: CreateItemInput!) {
    createItem(input: $input) {
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
`;

export const UPDATE_ITEM_MUTATION = gql`
  mutation UpdateItem($id: ID!, $input: UpdateItemInput!) {
    updateItem(id: $id, input: $input) {
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

export const DELETE_ITEM_MUTATION = gql`
  mutation DeleteItem($id: ID!) {
    deleteItem(id: $id)
  }
`;

// Card
export const CREATE_CARD_MUTATION = gql`
  mutation CreateCard($columnId: ID!, $input: CreateCardInput!) {
    createCard(columnId: $columnId, input: $input) {
      id
      title
      cardType
      checked
      order
      videoUrl
      noteContent
      checklistItems {
        id
        text
        checked
      }
    }
  }
`;

export const UPDATE_CARD_MUTATION = gql`
  mutation UpdateCard($id: ID!, $input: UpdateCardInput!) {
    updateCard(id: $id, input: $input) {
      id
      title
      checked
      videoUrl
      videoPreview
      noteContent
      checklistItems {
        id
        text
        checked
      }
    }
  }
`;

export const DELETE_CARD_MUTATION = gql`
  mutation DeleteCard($id: ID!) {
    deleteCard(id: $id)
  }
`;

export const TOGGLE_CARD_CHECKED_MUTATION = gql`
  mutation ToggleCardChecked($id: ID!) {
    toggleCardChecked(id: $id) {
      id
      checked
    }
  }
`;

export const MOVE_CARD_MUTATION = gql`
  mutation MoveCard($id: ID!, $columnId: ID!, $order: Int!) {
    moveCard(id: $id, columnId: $columnId, order: $order) {
      id
      order
      column {
        id
      }
    }
  }
`;

export const ADD_ITEM_TO_COLUMN_MUTATION = gql`
  mutation AddItemToColumn($itemId: ID!, $columnId: ID!) {
    addItemToColumn(itemId: $itemId, columnId: $columnId) {
      id
      title
      cardType
      order
      column {
        id
      }
      item {
        id
      }
      videoUrl
      noteContent
      checklistItems {
        id
        text
        checked
      }
    }
  }
`;
