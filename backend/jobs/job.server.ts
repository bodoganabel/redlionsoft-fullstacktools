import { json } from "@sveltejs/kit";
import type { AuthService } from "../auth/auth.service";
import { JobService } from "./job.service";
import { z } from "zod";
import type { TServerJob } from "./job.types";


export const createJobEndpoint = (authService: AuthService<any, any, any, any>, jobService: JobService<TServerJob>) => {

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

        const jobData = await request.json();
        return await jobService.createJob(jobData);
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

        const requestData = await request.json();
        const { job, newJob } = requestData;

        return await jobService.updateJob(job, newJob);
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

        console.error("Not implemented yet")

    };

    return {
        GET,
        POST,
        PUT,
        DELETE,
        PATCH
    };
};
