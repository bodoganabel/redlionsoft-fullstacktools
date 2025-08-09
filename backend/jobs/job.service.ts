import { Collection, ObjectId } from "mongodb";
import { json } from "@sveltejs/kit";
import type { Cookies } from "@sveltejs/kit";
import { DateTime } from "luxon";
import { z } from "zod/v4";
import { Database } from "../database";
import { createServerJobSchema, EJobStatuses, JOB_RETRIES_ALLOWED_DEFAULT, type TServerJob } from "./job.types";
import type { AuthService } from "../auth/auth.service";
import { validate } from "../endpoints/utils";

export class JobService<TJobMetadata> {
    private collection!: Collection;
    private authService: AuthService<any, any, any, any>;
    private jobSchema: z.ZodType<TServerJob<TJobMetadata>>;
    private collectionName = "serverJobs";
    private actionExecutor: (job: TServerJob<TJobMetadata>) => Promise<{ error: null | string, data: null | string }>;

    constructor(
        authService: AuthService<any, any, any, any>,
        actionExecutor: (job: TServerJob<TJobMetadata>) => Promise<{ error: null | string, data: null | string }>,
        options: {
            collectionName?: string;
            metadataSchema: z.ZodType<TJobMetadata>;
        }
    ) {
        this.authService = authService;
        this.collectionName = options?.collectionName || this.collectionName;
        this.jobSchema = createServerJobSchema(options.metadataSchema);
        this.actionExecutor = actionExecutor;
    }

    /**
     * Initialize the collection when needed
     */
    private async initCollection() {
        if (!this.collection) {
            this.collection = await Database.createCollection(this.collectionName) as Collection<TServerJob<TJobMetadata>> as unknown as Collection;
        }
        return this.collection;
    }
    /**
     * Create a new job
     */
    async createJob(jobData: TServerJob<TJobMetadata>): Promise<{error: string | null, data: TServerJob<TJobMetadata> | null}> {
        try {
            await this.initCollection();

            const targetDateAheadFromNow_ms = DateTime.fromISO(jobData.targetDateIso, { setZone: true }).valueOf() - DateTime.now().valueOf();

            // Add user ID and default values
            jobData.userId = jobData.userId.toString();
            jobData.createdAt = jobData.createdAt || DateTime.now().toUTC().toISO();
            jobData.status = jobData.status || EJobStatuses.PENDING;
            jobData.retriesHappened = jobData.retriesHappened || 0;
            jobData.retriesAllowed = jobData.retriesAllowed || JOB_RETRIES_ALLOWED_DEFAULT;
            jobData.targetDateIso = jobData.targetDateIso;

            const {data: validatedJobData, error} = validate<TServerJob<TJobMetadata>>(jobData, this.jobSchema);
            if (!validatedJobData) {
                return {error: error, data: null};
            }

            const result = await this.collection.insertOne(validatedJobData);
            const insertedJob = await this.collection.findOne({ _id: result.insertedId }) as TServerJob<TJobMetadata> | null;

            if (insertedJob === null) {
                return {error: "Failed to create job", data: null};
            }

            return {error: null, data: insertedJob};
        } catch (error) {
            console.error("Failed to create job:", error);
            return {error: JSON.stringify(error), data: null};
        }
    }

    /**
     * Get jobs by various criteria
     */
    async getJobs(request: Request, cookies: Cookies): Promise<{error: string | null, data: TServerJob<TJobMetadata>[] | null}> {
        try {
            await this.initCollection();

            const user = await this.authService.getServerUserFromCookies(cookies);
            if (!user) {
                return {error: "Unauthorized", data: null};
            }

            const url = new URL(request.url);
            const jobId = url.searchParams.get("jobId");
            const status = url.searchParams.get("status");
            const name = url.searchParams.get("name");

            // Build query based on parameters
            const query: Record<string, any> = { userId: user._id };

            if (jobId) {
                try {
                    query._id = new ObjectId(jobId);
                } catch (error) {
                    return {error: "Invalid job ID format", data: null};
                }
            }

            if (status) {
                query.status = status;
            }

            if (name) {
                query.name = { $regex: name, $options: "i" };
            }

            const results = await this.collection.find(query).toArray() as TServerJob<TJobMetadata>[];

            return {error: null, data: results};
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
            return {error: JSON.stringify(error), data: null};
        }
    }

    /**
     * Update an existing job
     */
    async updateJob(oldJob: TServerJob<TJobMetadata>, newJob: Partial<TServerJob<TJobMetadata>>): Promise<{error: string | null, data: TServerJob<TJobMetadata> | null}> {
        try {
            await this.initCollection();
            // Find the existing job
            const existingJob = await this.collection.findOne({
                _id: oldJob._id as any,
            });

            if (!existingJob) {
                return {error: "Job not found", data: null} ;
            }

            // Merge with existing job and validate
            const updatedJob = {
                ...oldJob,
                ...newJob,
                _id: existingJob._id,  // Ensure ID doesn't change
                userId: existingJob.userId,  // Ensure user doesn't change
                updatedAt: DateTime.now().toUTC().toISO()
            };

            const {data: validatedJobData, error} = validate<TServerJob<TJobMetadata>>(updatedJob, this.jobSchema);
            if (error) {
                return {error: error, data: null};
            }

            // Ensure validatedJobData is not null (should never happen if validation succeeds)
            if (!validatedJobData) {
                return {error: "Validation succeeded but data is null", data: null};
            }

            // Update the job
            const result = await this.collection.findOneAndUpdate(
                { _id: existingJob._id },
                { $set: validatedJobData },
                { returnDocument: "after" }
            );

            if (!result) {
                return {error: "Failed to update job", data: null};
            }

            const freshJob = result.value as TServerJob<TJobMetadata>;

            return {error: null, data: freshJob};
        } catch (error) {
            console.error("Failed to update job:", error);
            return {error: "Failed to update job", data: null};
        }
    }

    /**
     * Delete a job
     */
    async deleteJob(request: Request, cookies: Cookies): Promise<Response> {
        try {
            await this.initCollection();
            const user = await this.authService.getServerUserFromCookies(cookies);
            if (!user) {
                return json({
                    error: {
                        message: "Unauthorized",
                        code: "AUTH_REQUIRED"
                    }
                }, { status: 401 });
            }

            const requestData = await request.json();
            const { jobId } = requestData;

            if (!jobId) {
                return json({
                    error: {
                        message: "Job ID is required",
                        code: "MISSING_FIELD"
                    }
                }, { status: 400 });
            }

            let objectId;
            try {
                objectId = new ObjectId(jobId);
            } catch (error) {
                return json({
                    error: {
                        message: "Invalid job ID format",
                        code: "VALIDATION_ERROR"
                    }
                }, { status: 400 });
            }

            const result = await this.collection.deleteOne({
                _id: objectId as any,
                userId: user._id
            });

            if (result.deletedCount === 0) {
                return json({
                    error: {
                        message: "Job not found",
                        code: "RESOURCE_NOT_FOUND"
                    }
                }, { status: 404 });
            }

            return json({
                data: { success: true }
            }, { status: 200 });
        } catch (error) {
            console.error("Failed to delete job:", error);
            return json({
                error: {
                    message: "Failed to delete job",
                    code: "DELETE_FAILED"
                }
            }, { status: 500 });
        }
    }


    async getPendingJobs(submissionId?: string): Promise<TServerJob<TJobMetadata>[]> {
        try {
            await this.initCollection();

            const now = DateTime.now().toUTC().toISO();

            // Find jobs that are pending and due to run
            const pendingJobs = await this.collection.find({
                status: EJobStatuses.PENDING,
                targetDateIso: { $lte: now },
                ...(submissionId ? { submissionId } : {})
            }).toArray();

            return pendingJobs as unknown as TServerJob<TJobMetadata>[] | [];
        } catch (error) {
            console.error("Failed to get pending jobs:", error);
            return [];
        }
    }

    /**
     * Process pending jobs that are due to run
     * This should be called by a cron job or similar
     */
    async processPendingJobs(): Promise<void> {
        try {
            await this.initCollection();

            const now = DateTime.now().toUTC().toISO();

            // Find jobs that are pending and due to run
            const pendingJobs = await this.collection.find({
                status: EJobStatuses.PENDING,
                targetDateIso: { $lte: now }
            }).toArray() as unknown as TServerJob<TJobMetadata>[] | [];

            for (const job of pendingJobs) {
                try {


                    if (job.retriesHappened >= job.retriesAllowed) {
                        const newResultAray = [...job.results || []];
                        newResultAray.push({
                            message: "Too many retries",
                            dateIso: DateTime.now().toUTC().toISO()
                        })


                        const $set: Partial<TServerJob<TJobMetadata>> = {
                            status: EJobStatuses.FAILED,
                            results: newResultAray,
                        }
                        await this.collection.updateOne(
                            { _id: job._id as any },
                            { $set }
                        );
                        continue;
                    } else {
                        const $set: Partial<TServerJob<TJobMetadata>> = {
                            retriesHappened: job.retriesHappened + 1
                        }
                        await this.collection.updateOne(
                            { _id: job._id as any },
                            {
                                $set
                            }
                        );
                    }

                    // Execute the job function
                    const result = await this.actionExecutor(job);

                    // Update job as completed
                    await this.collection.updateOne(
                        { _id: job._id as any },
                        {
                            $set: {
                                status: result.error === null ? EJobStatuses.COMPLETED : EJobStatuses.PENDING,
                                results: [...job.results || [], {
                                    message: result.error || result.data,
                                    dateIso: DateTime.now().toUTC().toISO()
                                }]
                            }
                        }
                    );

                    console.log(`Job ${job._id} execution ${result.error === null ? "success" : "failed, retrying later"}`);
                } catch (error) {
                    console.error(`Job ${job._id} execution failed with error:`, error);
                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                }
            }
        } catch (error) {
            console.error("Failed to process pending jobs:", error);
        }
    }
}
