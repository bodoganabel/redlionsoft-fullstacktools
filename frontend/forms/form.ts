import { writable, get, type Writable } from "svelte/store";

export interface IFormContext {
  errors: Writable<any>;
  touched: Writable<any>;
  validators: Writable<any>;
  inputNodes: HTMLElement[];
  validateAll: () => boolean;
}

export function createFormContext() {
  const errors = writable<any>({});
  const touched = writable<any>({});
  const validators = writable<any>({});
  const inputNodes: HTMLElement[] = [];

  const formContext: IFormContext = {
    errors,
    touched,
    validators,
    inputNodes,
    validateAll: () => false,
  };
  formContext.validateAll = () => {
    return validateAll(formContext);
  };
  return formContext;
}

export function validateAll(formContext: IFormContext) {
  const { inputNodes } = formContext;
  let allValid = true;

  inputNodes.forEach((node) => {
    const name = node.getAttribute("name");
    const value = getNodeValue(node);
    if (name) {
      if (!validate(name, value, formContext)) {
        allValid = false;
      }
    }
  });
  return allValid;
}

function getNodeValue(node: any) {
  let value;

  // Determine the type of the node and get the value accordingly
  if (node instanceof HTMLInputElement) {
    const type = node.type.toLowerCase();
    switch (type) {
      case "checkbox":
        value = node.checked;
        break;
      case "file":
        value = node.files;
        break;
      default:
        value = node.value;
    }
  } else if (node instanceof HTMLSelectElement) {
    value = node.value;
  } else if (node instanceof HTMLTextAreaElement) {
    value = node.value;
  } else {
    // For other elements like divs, you might need a custom approach
    value = node.textContent;
  }

  return value;
}

function validate(
  name: string,
  value: any,
  formContext: IFormContext
): boolean {
  // Get the current validation functions, and errors from the form context
  const { validators, errors } = formContext;

  const fieldValidators = get(validators)[name];

  // Run validation for the field
  const fieldErrors = fieldValidators
    .map((validate: (value: any) => string | undefined) => validate(value))
    .filter((error: any) => error); // Filter out non-string (undefined) errors.

  // Update the errors store
  errors.update((currentErrors: any) => ({
    ...currentErrors,
    [name]: fieldErrors,
  }));

  const inputNode = formContext.inputNodes.find(
    (node) => node.getAttribute("name") === name
  );
  if (inputNode) {
    updateInputErrorClass(inputNode, fieldErrors.length > 0);
  }

  return fieldErrors.length === 0;
}

/* Handles input events */
export function formField(
  node: HTMLElement,
  params: {
    formContext: IFormContext;
    validators: ((value: any) => string | undefined)[];
  }
) {
  const name = node.getAttribute("name");

  const { formContext, validators } = params;

  formContext.inputNodes.push(node);
  formContext.validators.update((currentValidators: any) => {
    currentValidators[`${name}`] = validators;
    return currentValidators;
  });
  const touched: Writable<any> = formContext.touched;

  const handleInteraction = (event: any) => {
    const name = node.getAttribute("name");
    if (name) {
      touched.update((t) => ({ ...t, [name]: true }));
      validate(name, getNodeValue(node), formContext);
    }
  };

  node.addEventListener("click", handleInteraction);
  node.addEventListener("blur", handleInteraction);
  node.addEventListener("input", handleInteraction);

  return {
    destroy() {
      node.removeEventListener("click", handleInteraction);
      node.removeEventListener("blur", handleInteraction);
      node.removeEventListener("input", handleInteraction);
    },
  };
}

function updateInputErrorClass(node: HTMLElement, hasError: boolean) {
  if (hasError) {
    node.classList.add("input-error");
  } else {
    node.classList.remove("input-error");
  }
}
