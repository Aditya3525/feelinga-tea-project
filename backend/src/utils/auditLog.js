import AuditLog from '../models/AuditLog.js';

export async function logAdminAction({ actor, action, entityType, entityId, summary, meta = {} }) {
    if (!actor?._id) return;
    try {
        await AuditLog.create({
            actor: actor._id,
            actorName: actor.name || 'Admin',
            actorRole: actor.role || 'admin',
            action,
            entityType,
            entityId: entityId ? String(entityId) : undefined,
            summary,
            meta,
        });
    } catch (err) {
        console.error('[AUDIT] Failed to write audit log:', err.message);
    }
}
