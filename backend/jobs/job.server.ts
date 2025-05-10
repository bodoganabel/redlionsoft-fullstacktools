import { json } from "@sveltejs/kit";
import type { AuthService } from "../auth/auth.service";
import { JobService } from "./job.service";
import { z } from "zod";

export const createJobEndpoint = <TJobMetadataSchema extends z.ZodType>(authService: AuthService<any, any, any, any>, jobService: JobService<TJobMetadataSchema>) => {

    // Create a new job
    const POST = async ({ request, cookies }: any) => {
        const user = await authService.getServerUserFromCookies(cookies);

        if (!user) {
            return json({
                error: {
                    message: "User not authenticated",
                    code: "AUTH_REQUIRED"
                }
            }, { status: 401 });
        }

        return await jobService.createJob(request, cookies);
    };

    // Get jobs
    const GET = async ({ request, cookies }: any) => {
        const user = await authService.getServerUserFromCookies(cookies);

        if (!user) {
            return json({
                error: {
                    message: "User not authenticated",
                    code: "AUTH_REQUIRED"
                }
            }, { status: 401 });
        }

        return await jobService.getJobs(request, cookies);
    };

    // Update job
    const PUT = async ({ request, cookies }: any) => {
        const user = await authService.getServerUserFromCookies(cookies);

        if (!user) {
            return json({
                error: {
                    message: "User not authenticated",
                    code: "AUTH_REQUIRED"
                }
            }, { status: 401 });
        }

        return await jobService.updateJob(request, cookies);
    };

    // Delete job
    const DELETE = async ({ request, cookies }: any) => {
        const user = await authService.getServerUserFromCookies(cookies);

        if (!user) {
            return json({
                error: {
                    message: "User not authenticated",
                    code: "AUTH_REQUIRED"
                }
            }, { status: 401 });
        }

        return await jobService.deleteJob(request, cookies);
    };

    // Execute job immediately
    const PATCH = async ({ request, cookies }: any) => {
        const user = await authService.getServerUserFromCookies(cookies);

        if (!user) {
            return json({
                error: {
                    message: "User not authenticated",
                    code: "AUTH_REQUIRED"
                }
            }, { status: 401 });
        }

        return await jobService.executeJob(request, cookies);
    };

    return {
        GET,
        POST,
        PUT,
        DELETE,
        PATCH
    };
};
