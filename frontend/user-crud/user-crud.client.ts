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

  async updateResource(oldName: string, newName: string, newData: TResourceData): Promise<boolean> {
    // Fetch all resources to check for existence
    const { data: resources } = await apiRequest<TResource<TResourceData>[]>({
      url: this.baseUrl,
      method: "GET",
    });
    if (!resources) {
      toastError("Could not load resources");
      return false;
    }
    const oldResource = resources.find((r) => r.resourceId === oldName);
    const newResource = resources.find((r) => r.resourceId === newName);

    // If oldName === newName, just update the resource
    if (oldName === newName) {
      const { data, error } = await apiRequest({
        url: this.baseUrl,
        method: "PUT",
        body: {
          order: oldResource?.order ?? undefined,
          resourceId: newName,
          data: newData,
        },
      });
      if (data) {
        toastSuccess(`${newName} updated successfully`);
        return true;
      }
      toastError(error?.message || "Failed to update resource");
      return false;
    }

    // If newName exists, overwrite it
    if (newResource) {
      // Overwrite newName with newData
      const { data, error } = await apiRequest({
        url: this.baseUrl,
        method: "PUT",
        body: {
          order: newResource.order,
          resourceId: newName,
          data: newData,
        },
      });
      if (!data) {
        toastError(error?.message || `Failed to overwrite resource '${newName}'`);
        return false;
      }
    } else {
      // Create new resource with newName
      const { data, error } = await apiRequest({
        url: this.baseUrl,
        method: "PUT",
        body: {
          resourceId: newName,
          data: newData,
        },
      });
      if (!data) {
        toastError(error?.message || `Failed to create resource '${newName}'`);
        return false;
      }
    }

    // Optionally delete the old resource if it exists and name changed
    if (oldResource && oldName !== newName) {
      const { error: delError } = await apiRequest({
        url: this.baseUrl,
        method: "DELETE",
        body: { resourceId: oldName },
      });
      if (delError) {
        toastError(delError?.message || `Failed to delete old resource '${oldName}'`);
        // Still return true since update succeeded, but warn in UI
      }
    }
    toastSuccess("Resource updated and renamed successfully");
    return true;
  }

  // Existing renameResource function below (unchanged)
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
  ): Promise<boolean> {

    const { data, error } = await apiRequest({
      url: this.baseUrl,
      method: "DELETE",
      body: { resourceId: resource.resourceId },
    });

    if (data) {
      toastSuccess("Resource deleted successfully");
      return true;
    }
    toastError(error?.message || "Failed to delete resource");
    return false;
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
