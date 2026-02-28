import AuditLog from '../models/AuditLog.js';

interface LogParams {
    actor: any;
    action: string;
    entityType: string;
    entityId?: any;
    summary: string;
    meta?: Record<string, any>;
}

export async function logAdminAction({ actor, action, entityType, entityId, summary, meta = {} }: LogParams) {
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
    } catch (err: any) {
        console.error('[AUDIT] Failed to write audit log:', err.message);
    }
}
