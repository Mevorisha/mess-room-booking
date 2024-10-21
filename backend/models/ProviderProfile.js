import mongoose from "mongoose";
import ProfileProvider from "../schema/classes/ProfileProvider.js";

const providerProfileSchema = new mongoose.Schema(ProfileProvider.getMongoSchema());
const ProviderProfileModel = mongoose.model("ProviderProfile", providerProfileSchema);
export default ProviderProfileModel;
