/**
 * Tag component marking a pooled entity as inactive.
 * Pool deactivate → addComponent(world, eid, Inactive).
 * Pool activate → removeComponent(world, eid, Inactive).
 * Queries use Not(Inactive) to skip inactive entities at the engine level,
 * eliminating the manual `if (Active.isActive[eid] === 0) continue` pattern.
 */
export const Inactive = {}
