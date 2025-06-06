import SchedulerTimes from "@/models/SchedulerTimes";

type TimeUnits = "ms" | "sec" | "min" | "hr" | "day" | "mon";

export interface Job {
  intervalMs: number;
  jobFunction: Function;
}

export default class JobScheduler {
  static #instance: JobScheduler | null = null;

  #jobs: Map<string, Job>;

  #timeUnitToMs: Record<TimeUnits, number> = {
    ms: 1,
    sec: 1000,
    min: 60 * 1000,
    hr: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    mon: 30 * 24 * 60 * 60 * 1000, // Approximation for month
  } as const;

  private constructor() {
    this.#jobs = new Map<string, Job>();
    if (JobScheduler.#instance) {
      return JobScheduler.#instance;
    }
    JobScheduler.#instance = this;
  }

  static getInstance() {
    return new JobScheduler();
  }

  /**
   * Convert frequency and unit to milliseconds
   * @param {number} frequency - The frequency value
   * @param {TimeUnits} unit - The time unit (ms, sec, min, hr, day, mon)
   * @returns {number} - Milliseconds
   */
  convertToMs(frequency: number, unit: TimeUnits): number {
    return frequency * this.#timeUnitToMs[unit];
  }

  /**
   * Add a new job to the scheduler
   * @param {string} jobId - Unique identifier for the job
   * @param {number} frequency - How often the job should run
   * @param {TimeUnits} unit - Time unit for frequency (ms, sec, min, hr, day, mon)
   * @param {Function} jobFunction - The function to execute
   */
  addJob(jobId: string, frequency: number, unit: TimeUnits, jobFunction: Function) {
    if (frequency <= 0) {
      throw new Error("Frequency must be a positive number");
    }
    const intervalMs = this.convertToMs(frequency, unit);
    this.#jobs.set(jobId, { intervalMs, jobFunction });
    return this;
  }

  /**
   * Check and run all scheduled jobs that are due, using batch retrieval and parallel execution
   */
  async run(): Promise<void> {
    const currentTime = Date.now();

    try {
      // Get all job run times in a single batch
      const lastRunTimes = await SchedulerTimes.getAll();
      // Create an array to hold all job execution promises
      const jobPromises: Promise<void>[] = [];
      // Process each job
      for (const [jobId, job] of this.#jobs.entries()) {
        // Get the last execution time from the map
        const lastRunTime = lastRunTimes.get(jobId) || 0;
        // Check if job should run
        if (lastRunTime + job.intervalMs <= currentTime) {
          // Create a promise for this job and add to array
          const mkJobPromise = async () => {
            try {
              // Execute job
              await job.jobFunction();
              // Update last run time in DB
              await SchedulerTimes.set(jobId, currentTime);
              console.log(`[I] [JobScheduler] ran Job[${jobId}]`);
            } catch (error) {
              console.error(`[E] [JobScheduler] failed Job[${jobId}]:`, error);
            }
          };
          jobPromises.push(mkJobPromise());
        }
      }
      // Execute all due jobs in parallel
      await Promise.all(jobPromises);
    } catch (error) {
      console.error("[E] [JobScheduler] run cycle:", error);
    }
  }

  /**
   * Remove a job from the scheduler
   * @param {string} jobId - ID of the job to remove
   */
  removeJob(jobId: string) {
    if (this.#jobs.has(jobId)) {
      this.#jobs.delete(jobId);
      return true;
    }
    return false;
  }

  /**
   * Get all registered jobs
   * @returns {Map<string, Job>} - All jobs
   */
  getJobs(): Map<string, Job> {
    return this.#jobs;
  }
}
