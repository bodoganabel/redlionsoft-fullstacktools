import { Collection, ObjectId } from "mongodb";
import { json } from "@sveltejs/kit";
import type { Cookies } from "@sveltejs/kit";
import { DateTime } from "luxon";
import { z } from "zod/v4";
import { Database } from "../database";
import { createServerJobSchema, EJobStatuses, JOB_RETRIES_ALLOWED_DEFAULT, type TServerJob } from "./job.types";
import type { AuthService } from "../auth/auth.service";
import { devOnly } from "../../common/utilities/general";

export class JobService<TJobMetadata> {
    private collection!: Collection;
    private authService: AuthService<any, any, any, any>;
    private jobSchema: z.ZodType;
    private collectionName = "serverJobs";
    private actionExecutor: (job: TServerJob<TJobMetadata>) => Promise<{ error: null | string, data: null | string }>;

    constructor(
        authService: AuthService<any, any, any, any>,
        actionExecutor: (job: TServerJob<TJobMetadata>) => Promise<{ error: null | string, data: null | string }>,
        options: {
            collectionName?: string;
            metadataSchema: z.ZodType;
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
     * Validate job data using the schema
     */
    private validateJobData(data: unknown): z.infer<typeof this.jobSchema> | null {
        try {
            devOnly(() => {
                console.log("Validating job data:", data);
            });

            const validated = this.jobSchema.parse(data);

            devOnly(() => {
                console.log("Job validation passed:", validated);
            });

            return validated;
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.log('Job validation errors:');
                console.log(error.flatten());
                console.error(error.format());
            }
            return null;
        }
    }

    /**
     * Create a new job
     */
    async createJob(jobData: TServerJob<TJobMetadata>): Promise<Response> {
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

            const validatedJobData = this.validateJobData(jobData);
            if (!validatedJobData) {
                return json({
                    error: {
                        message: "Invalid job data format",
                        code: "VALIDATION_ERROR"
                    }
                }, { status: 400 });
            }

            const result = await this.collection.insertOne(validatedJobData);

            return json({
                data: { ...validatedJobData, _id: result.insertedId }
            }, { status: 200 });
        } catch (error) {
            console.error("Failed to create job:", error);
            return json({
                error: {
                    message: "Failed to create job",
                    code: "INSERT_FAILED"
                }
            }, { status: 500 });
        }
    }

    /**
     * Get jobs by various criteria
     */
    async getJobs(request: Request, cookies: Cookies): Promise<Response> {
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
                    return json({
                        error: {
                            message: "Invalid job ID format",
                            code: "VALIDATION_ERROR"
                        }
                    }, { status: 400 });
                }
            }

            if (status) {
                query.status = status;
            }

            if (name) {
                query.name = { $regex: name, $options: "i" };
            }

            const results = await this.collection.find(query).toArray();

            return json({
                data: results
            }, { status: 200 });
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
            return json({
                error: {
                    message: "Failed to fetch jobs",
                    code: "FETCH_ERROR"
                }
            }, { status: 500 });
        }
    }

    /**
     * Update an existing job
     */
    async updateJob(oldJob: TServerJob<TJobMetadata>, newJob: Partial<TServerJob<TJobMetadata>>): Promise<Response> {
        try {
            await this.initCollection();
            // Find the existing job
            const existingJob = await this.collection.findOne({
                _id: oldJob._id as any,
            });

            if (!existingJob) {
                return json({
                    error: {
                        message: "Job not found",
                        code: "RESOURCE_NOT_FOUND"
                    }
                }, { status: 404 });
            }

            // Merge with existing job and validate
            const updatedJob = {
                ...oldJob,
                ...newJob,
                _id: existingJob._id,  // Ensure ID doesn't change
                userId: existingJob.userId,  // Ensure user doesn't change
                updatedAt: DateTime.now().toUTC().toISO()
            };

            const validatedJobData = this.validateJobData(updatedJob);
            if (!validatedJobData) {
                return json({
                    error: {
                        message: "Invalid job data format",
                        code: "VALIDATION_ERROR"
                    }
                }, { status: 400 });
            }

            // Update the job
            const result = await this.collection.findOneAndUpdate(
                { _id: existingJob._id },
                { $set: validatedJobData },
                { returnDocument: "after" }
            );

            if (!result) {
                return json({
                    error: {
                        message: "Failed to update job",
                        code: "UPDATE_FAILED"
                    }
                }, { status: 500 });
            }

            return json({
                data: result
            }, { status: 200 });
        } catch (error) {
            console.error("Failed to update job:", error);
            return json({
                error: {
                    message: "Failed to update job",
                    code: "UPDATE_FAILED"
                }
            }, { status: 500 });
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
