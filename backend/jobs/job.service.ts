import { Collection, ObjectId } from "mongodb";
import { json } from "@sveltejs/kit";
import type { Cookies } from "@sveltejs/kit";
import { DateTime } from "luxon";
import { z } from "zod";
import { Database } from "../database";
import { createServerJobSchema, EJobStatuses, type TServerJob, type ExtractJobMetadataType } from "./job.types";
import type { AuthService } from "../auth/auth.service";
import { devOnly } from "../../common/utilities/general";


export class JobService<TJobMetadataSchema extends z.ZodType> {
    private collection!: Collection<TServerJob<ExtractJobMetadataType<TJobMetadataSchema>>>;
    private authService: AuthService<any, any, any, any>;
    private jobSchema: z.ZodType;
    private collectionName = "serverJobs";
    private actionExecutor: (job: TServerJob<ExtractJobMetadataType<TJobMetadataSchema>>) => Promise<void>;

    constructor(
        authService: AuthService<any, any, any, any>,
        actionExecutor: (job: TServerJob<ExtractJobMetadataType<TJobMetadataSchema>>) => Promise<void>,
        options: {
            collectionName?: string;
            metadataSchema: TJobMetadataSchema;
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
            this.collection = await Database.createCollection(this.collectionName) as Collection<TServerJob<ExtractJobMetadataType<TJobMetadataSchema>>>;
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
                console.log(error.errors.map(e => `Field '${e.path.join('.') || '(root)'}': ${e.message}`).join('; '));
                console.error(error.format());
            }
            return null;
        }
    }

    /**
     * Create a new job
     */
    async createJob(jobData: TServerJob<TJobMetadataSchema>): Promise<Response> {
        try {
            await this.initCollection();

            // Add user ID and default values
            jobData.userId = jobData.userId.toString();
            jobData.createdAt = jobData.createdAt || DateTime.now().toISO();
            jobData.status = jobData.status || EJobStatuses.PENDING;
            jobData.retries = jobData.retries || 3;
            jobData.retryCount = jobData.retryCount || 0;

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
    async updateJob(request: Request, cookies: Cookies): Promise<Response> {
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
            const { jobId, job } = requestData;

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

            // Find the existing job
            const existingJob = await this.collection.findOne({
                _id: objectId as any,
                userId: user._id
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
                ...existingJob,
                ...job,
                _id: existingJob._id,  // Ensure ID doesn't change
                userId: existingJob.userId,  // Ensure user doesn't change
                updatedAt: DateTime.now().toISO()
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
                { _id: objectId as any, userId: user._id },
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

    /**
     * Execute a job immediately
     */
    async executeJob(request: Request, cookies: Cookies): Promise<Response> {
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

            // Find the job
            const job = await this.collection.findOne({
                _id: objectId as any,
                userId: user._id
            });

            if (!job) {
                return json({
                    error: {
                        message: "Job not found",
                        code: "RESOURCE_NOT_FOUND"
                    }
                }, { status: 404 });
            }

            // Update job status to running
            await this.collection.updateOne(
                { _id: objectId as any },
                { $set: { status: EJobStatuses.RUNNING } }
            );

            try {
                // Execute the job function with the provided arguments
                const result = await this.actionExecutor(job);

                // Update job status to completed
                await this.collection.updateOne(
                    { _id: objectId as any },
                    {
                        $set: {
                            status: EJobStatuses.COMPLETED,
                            completedAt: DateTime.now().toISO(),
                            result: result
                        }
                    }
                );

                return json({
                    data: { success: true, result }
                }, { status: 200 });
            } catch (error) {
                console.error("Job execution failed:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error";

                // Increment retry count
                const updatedJob = await this.collection.findOneAndUpdate(
                    { _id: objectId as any },
                    {
                        $inc: { retryCount: 1 },
                        $set: {
                            status: job.retryCount >= job.retries ? EJobStatuses.FAILED : EJobStatuses.PENDING,
                            lastError: errorMessage,
                            lastErrorTimestamp: DateTime.now().toISO()
                        }
                    },
                    { returnDocument: "after" }
                );

                return json({
                    error: {
                        message: "Job execution failed",
                        code: "EXECUTION_FAILED",
                        details: {
                            error: errorMessage,
                            job: updatedJob
                        }
                    }
                }, { status: 500 });
            }
        } catch (error) {
            console.error("Failed to execute job:", error);
            return json({
                error: {
                    message: "Failed to execute job",
                    code: "EXECUTION_FAILED"
                }
            }, { status: 500 });
        }
    }


    async getPendingJobs(): Promise<TServerJob[]> {
        try {
            await this.initCollection();

            const now = DateTime.now().toISO();

            // Find jobs that are pending and due to run
            const pendingJobs = await this.collection.find({
                status: EJobStatuses.PENDING,
                targetDateIso: { $lte: now }
            }).toArray();

            return pendingJobs as TServerJob[];
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

            const now = DateTime.now().toISO();

            // Find jobs that are pending and due to run
            const pendingJobs = await this.collection.find({
                status: EJobStatuses.PENDING,
                targetDateIso: { $lte: now }
            }).toArray();

            console.log(`Processing ${pendingJobs.length} pending jobs`);

            for (const job of pendingJobs) {
                try {
                    // Mark job as running
                    await this.collection.updateOne(
                        { _id: job._id as any },
                        { $set: { status: EJobStatuses.RUNNING } }
                    );

                    // Execute the job function
                    const result = await this.actionExecutor(job);

                    // Update job as completed
                    await this.collection.updateOne(
                        { _id: job._id as any },
                        {
                            $set: {
                                status: EJobStatuses.COMPLETED,
                                completedAt: DateTime.now().toISO(),
                                result: result
                            }
                        }
                    );

                    console.log(`Job ${job._id} completed successfully`);
                } catch (error) {
                    console.error(`Job ${job._id} execution failed:`, error);
                    const errorMessage = error instanceof Error ? error.message : "Unknown error";

                    // Increment retry count and update status
                    await this.collection.updateOne(
                        { _id: job._id as any },
                        {
                            $inc: { retryCount: 1 },
                            $set: {
                                status: job.retryCount >= job.retries ? EJobStatuses.FAILED : EJobStatuses.PENDING,
                                lastError: errorMessage,
                                lastErrorTimestamp: DateTime.now().toISO()
                            }
                        }
                    );
                }
            }
        } catch (error) {
            console.error("Failed to process pending jobs:", error);
        }
    }
}
