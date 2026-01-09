import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    content: string;
    image?: string; // URL or base64
    active: boolean;
    createdAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        image: { type: String },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Announcement: Model<IAnnouncement> = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default Announcement;
