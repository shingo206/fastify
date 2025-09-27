import * as mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    country?: string;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    createdAt: Date,
    updatedAt: Date,
}

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
    },
    country: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {timestamps: true});

userSchema.index({email: 1});
userSchema.index({name: 1});
userSchema.index({createdAt: -1});

export default mongoose.model<IUser>('User', userSchema);
