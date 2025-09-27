import {Boolean} from '@sinclair/typebox';
import * as mongoose from 'mongoose';

const thumbnailSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    videoName: {type: String, required: true, unique: true},
    version: String,
    image: {type: String, required: true},
    paid: {type: Boolean, default: false},
}, {timestamps: true});

module.exports = mongoose.model('Thumbnail', thumbnailSchema);
