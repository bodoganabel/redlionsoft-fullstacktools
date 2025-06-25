import { json } from "@sveltejs/kit";
import type { AuthService } from "../auth/auth.service";
import { UserCrudService } from "./user-crud.server.service";
import { Database } from "../database";
import type { z } from "zod/v4";

export const createUCrudEndpoint = async (
  authService: AuthService,
  uCrudResourceName: string,
  dataSchema: z.ZodSchema,
  permissions: string[]
) => {
  const uCrudService = new UserCrudService(
    await Database.createCollection<any>(uCrudResourceName),
    authService,
    { dataSchema }
  );

  const POST = async ({ request, cookies }: any) => {
    const user = await authService.getServerUserFromCookies(cookies);

    if (!user) {
      return json({ status: 403, error: "User not authenticated." });
    }

    if (!(await authService.hasPermissions(user, permissions))) {
      return json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return await uCrudService.create(request, cookies);
  };

  // Gets one or multiple filter templates based on the request
  const GET = async ({ request, cookies }: any) => {
    const user = await authService.getServerUserFromCookies(cookies);

    if (!user) {
      return json({ status: 403, error: "User not authenticated." });
    }

    if (!(await authService.hasPermissions(user, []))) {
      return json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return await uCrudService.get(request, cookies);
  };

  const PUT = async ({ request, cookies }: any) => {
    const user = await authService.getServerUserFromCookies(cookies);

    if (!user) {
      return json({ status: 403, error: "User not authenticated." });
    }

    if (!(await authService.hasPermissions(user, permissions))) {
      return json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return await uCrudService.update(request, cookies);
  };

  const DELETE = async ({ request, cookies }: any) => {
    const user = await authService.getServerUserFromCookies(cookies);

    if (!user) {
      return json({ status: 403, error: "User not authenticated." });
    }

    if (!(await authService.hasPermissions(user, permissions))) {
      return json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return await uCrudService.delete(request, cookies);
  };

  // Handles reordering of resources
  const PATCH = async ({ request, cookies }: any) => {
    const user = await authService.getServerUserFromCookies(cookies);

    if (!user) {
      return json({ status: 403, error: "User not authenticated." });
    }

    if (!(await authService.hasPermissions(user, permissions))) {
      return json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return await uCrudService.updateOrder(request, cookies);
  };

  return {
    GET,
    POST,
    PATCH,
    PUT,
    DELETE,
  };
};
