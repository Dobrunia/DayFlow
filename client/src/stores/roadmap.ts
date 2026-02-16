import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apolloClient } from '@/lib/apollo';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import { ROADMAP_QUERY } from '@/graphql/queries';
import {
  CREATE_ROADMAP_MUTATION,
  DELETE_ROADMAP_MUTATION,
  CREATE_ROADMAP_NODE_MUTATION,
  UPDATE_ROADMAP_NODE_MUTATION,
  DELETE_ROADMAP_NODE_MUTATION,
  REORDER_ROADMAP_NODES_MUTATION,
} from '@/graphql/mutations';
import type { Roadmap, RoadmapNode } from '@/graphql/types';

export const useRoadmapStore = defineStore('roadmap', () => {
  const currentRoadmap = ref<Roadmap | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRoadmap(workspaceId: string) {
    try {
      loading.value = true;
      error.value = null;
      const { data } = await apolloClient.query({
        query: ROADMAP_QUERY,
        variables: { workspaceId },
        fetchPolicy: 'network-only',
      });
      currentRoadmap.value = data.roadmap ? structuredClone(data.roadmap) : null;
      return data.roadmap;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Background-friendly fetch: only replaces currentRoadmap if the data
   * actually changed (JSON comparison). No loading flag → no spinner flash.
   */
  async function softFetchRoadmap(workspaceId: string) {
    try {
      const { data } = await apolloClient.query({
        query: ROADMAP_QUERY,
        variables: { workspaceId },
        fetchPolicy: 'network-only',
      });
      const incoming = data.roadmap ?? null;
      // Only replace if something actually changed
      if (JSON.stringify(currentRoadmap.value) !== JSON.stringify(incoming)) {
        currentRoadmap.value = incoming ? structuredClone(incoming) : null;
      }
      return incoming;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function createRoadmap(workspaceId: string, title: string, sourceText?: string) {
    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: CREATE_ROADMAP_MUTATION,
        variables: { workspaceId, title, sourceText },
      });
      const newRoadmap = data.createRoadmap as Roadmap;
      currentRoadmap.value = newRoadmap;
      return newRoadmap;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function deleteRoadmap(id: string) {
    const old = currentRoadmap.value;
    currentRoadmap.value = null;

    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: DELETE_ROADMAP_MUTATION,
        variables: { id },
      });
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      currentRoadmap.value = old;
      throw e;
    }
  }

  async function createNode(roadmapId: string, parentId: string | null, title: string) {
    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: CREATE_ROADMAP_NODE_MUTATION,
        variables: { roadmapId, parentId, title },
      });
      // Refetch to get updated tree — use workspaceId from current roadmap
      if (currentRoadmap.value) {
        await fetchRoadmap(currentRoadmap.value.workspaceId);
      }
      return data.createRoadmapNode as RoadmapNode;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function updateNode(id: string, updates: { title?: string; done?: boolean }) {
    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ROADMAP_NODE_MUTATION,
        variables: { id, ...updates },
      });
      // Optimistic update in tree (deep clone to avoid Apollo frozen objects)
      if (currentRoadmap.value) {
        const clone = JSON.parse(JSON.stringify(currentRoadmap.value));
        updateNodeInTree(clone.nodes, id, data.updateRoadmapNode);
        currentRoadmap.value = clone;
      }
      return data.updateRoadmapNode as RoadmapNode;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function deleteNode(id: string) {
    const workspaceId = currentRoadmap.value?.workspaceId;
    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: DELETE_ROADMAP_NODE_MUTATION,
        variables: { id },
      });
      if (workspaceId) await fetchRoadmap(workspaceId);
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function reorderNodes(roadmapId: string, parentId: string | null, nodeIds: string[]) {
    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: REORDER_ROADMAP_NODES_MUTATION,
        variables: { roadmapId, parentId, nodeIds },
      });
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  function clear() {
    currentRoadmap.value = null;
  }

  return {
    currentRoadmap,
    loading,
    error,
    fetchRoadmap,
    softFetchRoadmap,
    createRoadmap,
    deleteRoadmap,
    createNode,
    updateNode,
    deleteNode,
    reorderNodes,
    clear,
  };
});

// Helper: recursively update a node in the tree
function updateNodeInTree(nodes: RoadmapNode[], id: string, updates: Partial<RoadmapNode>) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes[i] = { ...nodes[i], ...updates };
      return true;
    }
    if (nodes[i].children?.length && updateNodeInTree(nodes[i].children, id, updates)) {
      return true;
    }
  }
  return false;
}
