import {
  toastError,
  toastSuccess,
} from "../../../frontend/functionality/toast/toast-logic";
import { popup } from "../../../frontend/functionality/popup/popup-logic";
import type {
  TFilter,
  TFilterTemplateResource,
} from "../../../frontend/ui/filter/filter.types";
const API_BASE_URL = "/app/calendar/users/api/users-filter-templates";

export async function loadTemplates(): Promise<TFilterTemplateResource[]> {
  const response = await fetch(API_BASE_URL);
  if (response.ok) {
    const data = (await response.json()) as TFilterTemplateResource[];
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
  const response = await fetch(API_BASE_URL);
  const existingTemplates = await response.json();
  const highestOrder = Math.max(
    ...existingTemplates.map((template: any) => template.order ?? 0),
    0
  );

  // Create the template with the correct data structure
  const newFilterTemplate = {
    resourceId: templateName,
    data: {
      isFavorite: false,
      filters: currentFilters.map((filter: TFilter) => ({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
      })),
    },
    order: highestOrder + 1,
    createdAt: new Date().toISOString(),
  };

  const saveResponse = await fetch(API_BASE_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newFilterTemplate),
  });

  if (saveResponse.ok) {
    toastSuccess("Template saved successfully");
    return true;
  }
  return false;
}

export async function renameTemplate(
  oldName: string,
  newName: string
): Promise<boolean> {
  const response = await fetch(API_BASE_URL);
  const templates = await response.json();
  const oldTemplate = templates.find(
    (template: any) => template.resourceId === oldName
  );
  if (!oldTemplate) {
    return false;
  }

  const saveResponse = await fetch(API_BASE_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resourceId: newName,
      data: {
        name: newName,
        filters: oldTemplate.data.filters,
        isFavorite: oldTemplate.data.isFavorite,
      },
      order: oldTemplate.order,
    }),
  });

  if (!saveResponse.ok) {
    toastError("Failed to rename template");
    return false;
  }

  const deleteResponse = await fetch(API_BASE_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceId: oldName }),
  });

  if (!deleteResponse.ok) {
    toastError("Failed to delete old template");
    return false;
  }

  toastSuccess("Template renamed successfully");
  return true;
}

export async function reorderTemplates(
  items: { resourceId: string; order: number }[]
): Promise<boolean> {
  const response = await fetch(API_BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  if (response.ok) {
    return true;
  }
  toastError("Failed to reorder templates");
  return false;
}

export async function handleTemplateReorder(
  resourceId: string,
  newIndex: number
): Promise<boolean> {
  const response = await fetch(API_BASE_URL);
  const currentTemplates = await response.json();

  const sortedTemplates = [...currentTemplates].sort(
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
      const response = await fetch(API_BASE_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      if (response.ok) {
        toastSuccess("Template deleted successfully");
        return true;
      }
      return false;
    },
    acceptMessage: "Delete",
    closeMessage: "Cancel",
  });
  return !!confirmResult;
}

export async function favoriteTemplate(
  template: TFilterTemplateResource
): Promise<boolean> {
  const response = await fetch(API_BASE_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resourceId: template.resourceId,
      data: {
        isFavorite: !template.data.isFavorite,
        filters: template.data.filters,
      },
    }),
  });
  return response.ok;
}
