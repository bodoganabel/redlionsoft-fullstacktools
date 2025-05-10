import { json } from "@sveltejs/kit";
import type { AuthService } from "../auth/auth.service";
import { JobService } from "./job.service";

export const createJobEndpoint = (authService: AuthService<any, any, any, any>) => {
    const jobService = new JobService(authService);

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

// Helper function to create a job service with custom metadata schema
export const createJobServiceWithMetadata = <T>(
    authService: AuthService<any, any, any, any>, 
    metadataSchema: any
) => {
    return JobService.createWithMetadataSchema<T>(authService, metadataSchema);
};
