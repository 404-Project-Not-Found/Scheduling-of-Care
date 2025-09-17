
/**
 * Handle system roles and permission access - handle RBAC or role based access 
 * 
 * Functionalities:
 *  - Defines the roles available in the system -- Role
 *  - Define all the permission types -- Permission
 *  - Map the roles to the permissions granted -- RolePermission
 *  - Handle the hierarchy of the invite and deletion of access - InviteDeleteHierarchy
 *  - A function which checks if the given role has the permission
 * 
 * For our implementation, Legal and Family have the same Permissions
 */

export type Role = 'MANAGEMENT'|'CARER'|'FAMILY_LEGAL';

export const Roles = {
    MANAGEMENT: 'MANAGEMENT',
    CARER: 'CARER',
    FAMILY_LEGAL: 'FAMILY_LEGAL',
} as const;

export const InviteDeleteHierarchy: Record<Role, Role[]> = {
    MANAGEMENT: ['CARER'],
    CARER: [],
    FAMILY_LEGAL: ["MANAGEMENT"],
};


export const PERMISSIONS = {
        // -- USER MANAGEMENT --
    USER_READ: 'user:read', // View users information
    USER_INVITE: 'user:invite', // Invite a new user -- in our case it's to create an access code
    USER_DELETE: 'user:delete', // Revoke access of an existing user

    // -- BUDGET --
    BUDGET_READ: 'budget:read', // View budget information -- entries and summaries
    BUDGET_EDIT: 'budget:edit', // Create and update the budget list

    // -- BUDGET COMMENTS --
    BUDGET_COMMENT_READ: 'budget:comment:read', // Read the comments on the budget -- comments made by carer
    BUDGET_COMMENT_EDIT:'budget:comment:edit', // Add or edit the comments relating to the budget

    // -- CARE ITEMS --
    CARE_READ: 'care:read', // View information on care items
    CARE_EDIT: 'care:edit', // Create/updates/delete care items
    CARE_RESOLVE: 'care:resolve', // Mark care item as resolved -- show that care item has been completed

    // -- CARE EVIDENCE --
    CARE_EVIDENCE_READ: 'care:evidence:read', // View evidence for a care item
    CARE_EVIDENCE_EDIT: 'care:evidence:edit', // Upload/delete evidence for a care item
    CARE_EVIDENCE_VERIFY: 'care:evidence:verify', // Verify that a care item has been completed

    // -- CARE COMMENTS --
    CARE_COMMENT_READ: 'care:comment:read', // View comments relating to a care item 
    CARE_COMMENT_EDIT: 'care:comment:edit', // Create/update/delete comments on a care item

    // -- MODIFICATION --
    NOTIF_READ: 'notif:read', // Read a modificiation request
    NOTIF_EDIT: 'notif:edit', // Write a modification request for a care item/budget
    NOTIF_SEND: 'notif:send', // Send a modification request
    NOTIF_RESOLVE: 'notif:resolve', // Modification request has been resolved -- communication done outside the system
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const RolePermission: Record<Role, Permission[]> = {
    MANAGEMENT: [
        PERMISSIONS.USER_READ, PERMISSIONS.USER_INVITE, PERMISSIONS.USER_DELETE ,PERMISSIONS.BUDGET_READ, 
        PERMISSIONS.BUDGET_EDIT, PERMISSIONS.BUDGET_COMMENT_READ, PERMISSIONS.CARE_READ, PERMISSIONS.CARE_EDIT,
        PERMISSIONS.CARE_EVIDENCE_READ, PERMISSIONS.CARE_EVIDENCE_VERIFY, PERMISSIONS.CARE_COMMENT_READ, 
        PERMISSIONS.NOTIF_READ, PERMISSIONS.NOTIF_RESOLVE], 
    CARER: [
        PERMISSIONS.BUDGET_READ, PERMISSIONS.BUDGET_COMMENT_READ, PERMISSIONS.BUDGET_COMMENT_EDIT,
        PERMISSIONS.CARE_READ, PERMISSIONS.CARE_RESOLVE, PERMISSIONS.CARE_EVIDENCE_READ, 
        PERMISSIONS.CARE_EVIDENCE_EDIT],
    FAMILY_LEGAL: [
        PERMISSIONS.USER_READ, PERMISSIONS.USER_INVITE, PERMISSIONS.USER_DELETE ,PERMISSIONS.BUDGET_READ,
        PERMISSIONS.BUDGET_COMMENT_READ, PERMISSIONS.CARE_READ,PERMISSIONS.CARE_EVIDENCE_READ, 
        PERMISSIONS.CARE_COMMENT_READ, PERMISSIONS.NOTIF_READ, PERMISSIONS.NOTIF_EDIT, PERMISSIONS.NOTIF_SEND],
};

// Check if a specific role has the permission
export function hasPermission(role: Role, permission: Permission) {
    return RolePermission[role]?.includes(permission) ?? false;
}

