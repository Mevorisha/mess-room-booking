import mongoose from 'mongoose';
import Account from '../schema/classes/Account.js';

const accountSchema = new mongoose.Schema(Account.getMongoSchema());
Object.keys(Account.pres).forEach((key) => accountSchema.pre(new RegExp(key), Account.pres[key]));
const AccountModel = mongoose.model('Account', accountSchema);
export default AccountModel;
