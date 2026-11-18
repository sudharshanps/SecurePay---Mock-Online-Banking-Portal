import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  actorId = null,
  actorEmail = null,
  actorRole = null,
  action,
  resourceType,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  details = {},
  result = 'SUCCESS',
}) => {
  try {
    const log = new AuditLog({
      actorId,
      actorEmail,
      actorRole,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      details,
      result,
      timestamp: new Date(),
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('[AuditLog] Failed to record audit log:', error.message);
  }
};
