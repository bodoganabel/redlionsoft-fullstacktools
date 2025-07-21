import { apiRequest } from "../../../client/api-request";
import { toastError } from "../../../functionality/toast/toast-logic";

const EMAIL_TEMPLATES_API = "/api/email-templates";

export async function reorderEmailTemplates(
  items: { resourceId: string; order: number }[]
): Promise<boolean> {
  const { error } = await apiRequest({
    url: EMAIL_TEMPLATES_API,
    method: "PATCH",
    body: { items },
  });
  if (!error) {
    return true;
  }
  // Standard toast error pattern
  toastError(error.details || "Failed to reorder email templates");
  return false;
}

export async function handleEmailTemplateReorder(
  resourceId: string,
  newIndex: number,
  templates: any[]
): Promise<boolean> {
  // templates: current list, already sorted DESCENDING as displayed in UI
  // We need to assign highest order to index 0, lowest to last
  const descendingOrder = templates.map((t, i) => ({
    resourceId: t.resourceId,
    order: templates.length - 1 - i,
  }));

  // Move the dragged template to the new index, maintaining descending order
  const oldIndex = templates.findIndex(t => t.resourceId === resourceId);
  const moved = [...templates];
  const [removed] = moved.splice(oldIndex, 1);
  moved.splice(newIndex, 0, removed);
  const reorderedItems = moved.map((t, i) => ({
    resourceId: t.resourceId,
    order: moved.length - 1 - i,
  }));

  return reorderEmailTemplates(reorderedItems);
}
