import JobScheduler from "@/lib/utils/JobScheduler";
import { updateRoomRatings } from "@/jobs/updateRoomRatings";

export function scheduleJobs() {
  // Example: Update room ratings every 24 hours
  JobScheduler.getInstance().addJob("UpdateRoomRatings", 1, "hr", updateRoomRatings);
}
