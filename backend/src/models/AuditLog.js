import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    actorName: {
        type: String,
        required: true,
    },
    actorRole: {
        type: String,
        default: 'admin',
    },
    action: {
        type: String,
        required: true,
    },
    entityType: {
        type: String,
        required: true,
    },
    entityId: {
        type: String,
    },
    summary: {
        type: String,
        required: true,
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
