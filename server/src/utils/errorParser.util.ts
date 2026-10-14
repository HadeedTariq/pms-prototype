import { Response } from "express";

export const errorParser = (parsed: any, res: Response) => {
  const fieldErrors = parsed?.error?.flatten?.().fieldErrors;

  if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
    return res.status(400).json({
      message: "Invalid input. Please check your form and try again.",
    });
  }

  const errorMessages = Object.entries(fieldErrors)
    .filter(([_, messages]: any) => messages && messages.length > 0)
    .map(([field, messages]: [string, any]) => {
      const fieldName =
        field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
      return `• ${fieldName}: ${messages.join(", ")}`;
    })
    .join("\n");

  return res.status(400).json({
    message: errorMessages.trim(),
  });
};

export const uuidErrorHandler = (id?: string) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    return false;
  }
  return true;
};
