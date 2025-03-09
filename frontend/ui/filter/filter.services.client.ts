import {
  toastError,
  toastSuccess,
} from "../../../frontend/functionality/toast/toast-logic";
import { popup } from "../../../frontend/functionality/popup/popup-logic";
import type { TFilterTemplateResource } from "../../../frontend/ui/filter/filter.types";
import { apiRequest } from "../../client/api-request";
const API_BASE_URL = "/app/users/api/users-filter-templates";

export async function loadTemplates(): Promise<TFilterTemplateResource[]> {
  const { data } = await apiRequest<any[]>({
    url: API_BASE_URL,
    method: "GET",
  });
  if (data) {
    return data.sort(
      (templateA, templateB) =>
        (templateA.order ?? Infinity) - (templateB.order ?? Infinity)
    );
  }
  return [];
}

export async function saveTemplate(
  templateName: string,
  currentFilters: any
): Promise<boolean> {
  const { data: existingTemplates } = await apiRequest<any[]>({
    url: API_BASE_URL,
    method: "GET",
  });
  const highestOrder = Math.max(
    ...(existingTemplates || []).map(
      (template: TFilterTemplateResource) => template.order ?? 0
    ),
    0
  );

  // Create the template with the correct data structure
  const newFilterTemplate = {
    resourceId: templateName,
    data: {
      isFavorite: false,
      filters: currentFilters.map((filter: any) => ({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
      })),
    },
    order: highestOrder + 1,
    createdAt: new Date().toISOString(),
  };

  const { data } = await apiRequest({
    url: API_BASE_URL,
    method: "PUT",
    body: newFilterTemplate,
  });

  if (data) {
    toastSuccess("Template saved successfully");
    return true;
  }
  return false;
}

export async function renameTemplate(
  oldName: string,
  newName: string
): Promise<boolean> {
  const { data: templates } = await apiRequest<any[]>({
    url: API_BASE_URL,
    method: "GET",
  });
  const oldTemplate = (templates || []).find(
    (template: any) => template.resourceId === oldName
  );
  if (!oldTemplate) {
    return false;
  }

  const { error: saveError } = await apiRequest({
    url: API_BASE_URL,
    method: "PUT",
    body: {
      resourceId: newName,
      data: {
        name: newName,
        filters: oldTemplate.data.filters,
        isFavorite: oldTemplate.data.isFavorite,
      },
      order: oldTemplate.order,
    },
  });

  if (saveError) {
    toastError(saveError.message || "Failed to rename template");
    return false;
  }

  const { error: deleteError } = await apiRequest({
    url: API_BASE_URL,
    method: "DELETE",
    body: { resourceId: oldName },
  });

  if (deleteError) {
    toastError(deleteError.message || "Failed to delete old template");
    return false;
  }

  toastSuccess("Template renamed successfully");
  return true;
}

export async function reorderTemplates(
  items: { resourceId: string; order: number }[]
): Promise<boolean> {
  const { data, error } = await apiRequest({
    url: API_BASE_URL,
    method: "PATCH",
    body: { items },
  });

  if (data) {
    return true;
  }
  toastError(error?.message || "Failed to reorder templates");
  return false;
}

export async function handleTemplateReorder(
  resourceId: string,
  newIndex: number
): Promise<boolean> {
  const { data: currentTemplates } = await apiRequest<any[]>({
    url: API_BASE_URL,
    method: "GET",
  });

  const sortedTemplates = [...(currentTemplates || [])].sort(
    (templateA: any, templateB: any) =>
      (templateA.order ?? Infinity) - (templateB.order ?? Infinity)
  );

  const oldIndex = sortedTemplates.findIndex(
    (template: any) => template.resourceId === resourceId
  );

  const reorderedItems = sortedTemplates.map((template: any, index: number) => {
    if (template.resourceId === resourceId) {
      return { resourceId: template.resourceId, order: newIndex };
    }

    if (oldIndex < newIndex) {
      if (index > oldIndex && index <= newIndex) {
        return { resourceId: template.resourceId, order: index - 1 };
      }
    } else {
      if (index >= newIndex && index < oldIndex) {
        return { resourceId: template.resourceId, order: index + 1 };
      }
    }

    return { resourceId: template.resourceId, order: index };
  });

  return reorderTemplates(reorderedItems);
}

export async function deleteTemplate(resourceId: string): Promise<boolean> {
  const confirmResult = await popup({
    id: "confirm-delete-template",
    title: `Are you sure you want to delete ${resourceId}?`,
    onAccept: async () => {
      const { data, error } = await apiRequest({
        url: API_BASE_URL,
        method: "DELETE",
        body: { resourceId },
      });
      if (data) {
        toastSuccess("Template deleted successfully");
        return true;
      }
      toastError(error?.message || "Failed to delete template");
      return false;
    },
    acceptMessage: "Delete",
    closeMessage: "Cancel",
  });
  return !!confirmResult;
}

export async function favoriteTemplate(template: any): Promise<boolean> {
  const { data } = await apiRequest({
    url: API_BASE_URL,
    method: "PUT",
    body: {
      resourceId: template.resourceId,
      data: {
        isFavorite: !template.data.isFavorite,
        filters: template.data.filters,
      },
    },
  });
  return !!data;
}
