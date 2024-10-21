import mongoose from "mongoose";
import Account from "../schema/classes/Account";

const accountSchema = new mongoose.Schema(Account.getMongoSchema());
Account.pres.forEach((k, v) => accountSchema.pre(k, v));
const AccountModel = mongoose.model("Account", accountSchema);
export default AccountModel;
