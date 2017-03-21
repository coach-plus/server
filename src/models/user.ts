import * as mongoose from "mongoose";


interface IUser {
    email: string;
    password: string;
}

export interface IUserModel extends IUser, mongoose.Document { };

let userSchema = new mongoose.Schema({
    email: String,
    password: String
});

export let User = mongoose.model<IUserModel>("User", userSchema);