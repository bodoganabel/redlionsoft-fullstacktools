import { toastError, toastSuccess } from "../functionality/toast/toast-logic";
import { popup } from "../functionality/popup/popup-logic";
import type { TResource } from "../../backend/user-crud/types";
import { apiRequest } from "../client/api-request";

export class UCrudResourceClient<TResourceData> {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async loadResources(): Promise<TResource<TResourceData>[]> {
    const { data, error } = await apiRequest<TResource<TResourceData>[]>({
      url: this.baseUrl,
      method: "GET",
    });
    if (data) {
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

    const { data: result } = await apiRequest({
      url: this.baseUrl,
      method: "PUT",
      body: { ...newResource },
    });

    if (result) {
      toastSuccess("Resource saved successfully");
      return newResource;
    }
    return null;
  }

  async renameResource(oldName: string, newName: string): Promise<boolean> {
    const { data: resources } = await apiRequest<any[]>({
      url: this.baseUrl,
      method: "GET",
    });
    const oldResource = (resources || []).find(
      (resource: any) => resource.resourceId === oldName
    );
    if (!oldResource) {
      return false;
    }

    const { error: saveError } = await apiRequest({
      url: this.baseUrl,
      method: "PUT",
      body: {
        resourceId: newName,
        data: {
          name: newName,
          filters: oldResource.data.filters,
          isFavorite: oldResource.data.isFavorite,
        },
        order: oldResource.order,
      },
    });

    if (saveError) {
      toastError(saveError.message || "Failed to rename resource");
      return false;
    }

    const { error: deleteError } = await apiRequest({
      url: this.baseUrl,
      method: "DELETE",
      body: { resourceId: oldName },
    });

    if (deleteError) {
      toastError(deleteError.message || "Failed to delete old resource");
      return false;
    }

    toastSuccess("Resource renamed successfully");
    return true;
  }

  async reorderResources(
    items: { resourceId: string; order: number }[]
  ): Promise<boolean> {
    const { data, error } = await apiRequest({
      url: this.baseUrl,
      method: "PATCH",
      body: { items },
    });

    if (data) {
      return true;
    }
    toastError(error?.message || "Failed to reorder resources");
    return false;
  }

  async handleResourceReorder(
    resourceId: string,
    newIndex: number
  ): Promise<boolean> {
    const { data: currentResources } = await apiRequest<any[]>({
      url: this.baseUrl,
      method: "GET",
    });

    const sortedResources = [...(currentResources || [])].sort(
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
        const { data, error } = await apiRequest({
          url: this.baseUrl,
          method: "DELETE",
          body: { resourceId: resource.resourceId },
        });
        await onConfirmDelete();
        if (data) {
          toastSuccess("Resource deleted successfully");
          return true;
        }
        toastError(error?.message || "Failed to delete resource");
        return false;
      },
      acceptMessage: "Delete",
      closeMessage: "Cancel",
    });
    return !!confirmResult;
  }

  async favoriteResource(resource: TResource<TResourceData>): Promise<boolean> {
    const { data } = await apiRequest({
      url: this.baseUrl,
      method: "PUT",
      body: {
        resourceId: resource.resourceId,
        data: resource.data,
      },
    });
    return !!data;
  }
}
