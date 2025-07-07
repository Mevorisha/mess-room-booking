import JobScheduler from "@/middlewares/JobScheduler/JobScheduler";
import { updateRoomRatings } from "@/middlewares/JobScheduler/jobs/updateRoomRatings";

export function scheduleJobs() {
  // Example: Update room ratings every 24 hours
  JobScheduler.getInstance().addJob("UpdateRoomRatings", 1, "hr", updateRoomRatings);
}
