import {
  toastError,
  toastSuccess,
} from "../../frontend/functionality/toast/toast-logic";
import { popup } from "../../frontend/functionality/popup/popup-logic";
import type { TResource } from "./types";

export class UCrudResourceClient<TResourceData> {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async loadResources(): Promise<TResource<TResourceData>[]> {
    const response = await fetch(this.baseUrl);
    if (response.ok) {
      const data = (await response.json()) as TResource<TResourceData>[];
      const sortedData = data.sort(
        (resourceA, resourceB) =>
          (resourceA.order ?? Infinity) - (resourceB.order ?? Infinity)
      );
      return sortedData;
    }
    return [];
  }

  async saveResource(
    resourceName: string,
    data: any
  ): Promise<TResource<TResourceData> | null> {
    const existingResources = await this.loadResources();
    const highestOrder = Math.max(
      ...existingResources.map((resource: any) => resource.order ?? 0),
      0
    );

    const newResource: TResource<TResourceData> = {
      data: data,
      resourceId: resourceName,
      createdAt: new Date().toISOString(),
    };

    console.log("newResource:");
    console.log(newResource);

    const saveResponse = await fetch(this.baseUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newResource }),
    });

    if (saveResponse.ok) {
      toastSuccess("Resource saved successfully");
      return newResource;
    }
    return null;
  }

  async renameResource(oldName: string, newName: string): Promise<boolean> {
    const response = await fetch(this.baseUrl);
    const resources = await response.json();
    const oldResource = resources.find(
      (resource: any) => resource.resourceId === oldName
    );
    if (!oldResource) {
      return false;
    }

    const saveResponse = await fetch(this.baseUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId: newName,
        data: {
          name: newName,
          filters: oldResource.data.filters,
          isFavorite: oldResource.data.isFavorite,
        },
        order: oldResource.order,
      }),
    });

    if (!saveResponse.ok) {
      toastError("Failed to rename resource");
      return false;
    }

    const deleteResponse = await fetch(this.baseUrl, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId: oldName }),
    });

    if (!deleteResponse.ok) {
      toastError("Failed to delete old resource");
      return false;
    }

    toastSuccess("Resource renamed successfully");
    return true;
  }

  async reorderResources(
    items: { resourceId: string; order: number }[]
  ): Promise<boolean> {
    const response = await fetch(this.baseUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (response.ok) {
      return true;
    }
    toastError("Failed to reorder resources");
    return false;
  }

  async handleResourceReorder(
    resourceId: string,
    newIndex: number
  ): Promise<boolean> {
    const response = await fetch(this.baseUrl);
    const currentResources = await response.json();

    const sortedResources = [...currentResources].sort(
      (resourceA: any, resourceB: any) =>
        (resourceA.order ?? Infinity) - (resourceB.order ?? Infinity)
    );

    const oldIndex = sortedResources.findIndex(
      (resource: any) => resource.resourceId === resourceId
    );

    const reorderedItems = sortedResources.map(
      (resource: any, index: number) => {
        if (resource.resourceId === resourceId) {
          return { resourceId: resource.resourceId, order: newIndex };
        }

        if (oldIndex < newIndex) {
          if (index > oldIndex && index <= newIndex) {
            return { resourceId: resource.resourceId, order: index - 1 };
          }
        } else {
          if (index >= newIndex && index < oldIndex) {
            return { resourceId: resource.resourceId, order: index + 1 };
          }
        }

        return { resourceId: resource.resourceId, order: index };
      }
    );

    return this.reorderResources(reorderedItems);
  }

  async deleteResource(
    resource: TResource<TResourceData>,
    onConfirmDelete: () => void | Promise<void>
  ): Promise<boolean> {
    const confirmResult = popup({
      id: "confirm-delete-resource",
      title: `Are you sure you want to delete ${resource.resourceId}?`,
      onAccept: async () => {
        const response = await fetch(this.baseUrl, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId: resource.resourceId }),
        });
        await onConfirmDelete();
        if (response.ok) {
          toastSuccess("Resource deleted successfully");
          return true;
        }
        return false;
      },
      acceptMessage: "Delete",
      closeMessage: "Cancel",
    });
    return !!confirmResult;
  }

  async favoriteResource(resource: TResource<TResourceData>): Promise<boolean> {
    const response = await fetch(this.baseUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId: resource.resourceId,
        data: resource.data,
      }),
    });
    return response.ok;
  }
}
