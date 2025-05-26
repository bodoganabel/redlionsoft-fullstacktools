/**
 * Utility functions for handling template variables in text content
 */

/**
 * Extract variables from content that are wrapped in double brackets
 * Example: {{name}} will extract 'name' as a variable
 * @param content The content to extract variables from
 * @returns Array of variable names found in the content
 */
export function extractTemplateVariables(content: string): string[] {
  if (!content) return [];
  
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: (string | undefined)[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    // match[1] contains the content inside the brackets
    if (!matches.includes(match[1])) {
      matches.push(match[1]);
    }
  }
  
  return matches.filter((match): match is string => match !== undefined);
}

/**
 * Apply template variable values to content
 * @param content The content containing template variables
 * @param variableValues Object mapping variable names to their values
 * @returns The content with variables replaced by their values
 */
export function applyTemplateVariables(content: string, variableValues: Record<string, string>): string {
  if (!content) return '';
  if (!variableValues || Object.keys(variableValues).length === 0) return content;
  
  let processedContent = content;
  
  Object.entries(variableValues).forEach(([variable, value]) => {
    if (value) {
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, value);
    }
  });
  
  return processedContent;
}

/**
 * Initialize template variable values
 * @param existingValues Existing variable values to preserve
 * @param variables Array of variable names
 * @returns Object with variable names as keys and values (preserving existing values)
 */
export function initializeTemplateVariableValues(
  existingValues: Record<string, string> = {},
  variables: string[]
): Record<string, string> {
  const values = { ...existingValues };
  
  variables.forEach(variable => {
    if (values[variable] === undefined) {
      values[variable] = '';
    }
  });
  
  return values;
}
