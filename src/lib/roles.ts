
/**
 * Handle system roles and permission access - handle RBAC or role based access 
 * 
 * Functionalities:
 *  - Defines the roles available in the system -- Role
 *  - Define all the permission types -- Permission
 *  - Map the roles to the permissions granted -- RolePermission
 *  - Handle the hierarchy of the invite and deletion of access - InviteDeleteHierarchy
 * 
 * For our implementation, Legal and Family have the same Permissions
 */

export type Role = 'MANAGEMENT'|'CARER'|'FAMILY'|'LEGAL';

export const Roles = {
    MANAGEMENT: 'MANAGEMENT',
    CARER: 'CARER',
    FAMILY: 'FAMILY',
    LEGAL: 'LEGAL'
} as const;

export const InviteDeleteHierarchy: Record<Role, Role[]> = {
    MANAGEMENT: ['CARER'],
    CARER: [],
    FAMILY: ["MANAGEMENT"],
    LEGAL: ["MANAGEMENT"]
};


export type Permission = 
    // -- USER MANAGEMENT --
    'user:read'| // View users information
    'user:invite'| // Invite a new user -- in our case it's to create an access code
    'user:delete'| // Revoke access of an existing user

    // -- BUDGET --
    'budget:read'| // View budget information -- entries and summaries
    'budget:edit'| // Create and update the budget list

    // -- BUDGET COMMENTS --
    'budget:comment:read'| // Read the comments on the budget -- comments made by carer
    'budget:comment:edit'| // Add or edit the comments relating to the budget

    // -- CARE ITEMS --
    'care:read'| // View information on care items
    'care:edit'| // Create/updates/delete care items
    'care:resolve'| // Mark care item as resolved -- show that care item has been completed

    // -- CARE EVIDENCE --
    'care:evidence:read'| // View evidence for a care item
    'care:evidence:edit'| // Upload/delete evidence for a care item
    'care:evidence:verify'| // Verify that a care item has been completed

    // -- CARE COMMENTS --
    'care:comment:read'| // View comments relating to a care item 
    'care:comment:edit'| // Create/update/delete comments on a care item

    // -- MODIFICATION --
    'notif:read'| // Read a modificiation request
    'notif:edit'| // Write a modification request for a care item/budget
    'notif:sent'| // Send a modification request
    'notif:resolve'; // Modification request has been resolved -- communication done outside the system


export const RolePermission: Record<Role, Permission[]> = {
    MANAGEMENT: [
        'user:read', 'user:invite', 'user:delete' ,'budget:read', 'budget:edit', 'budget:comment:read', 
        'care:read', 'care:edit', 'care:evidence:read', 'care:evidence:verify', 'care:comment:read', 
        'notif:read', 'notif:resolve'], 
    CARER: [
        'budget:read', 'budget:comment:read', 'budget:comment:edit', 'care:read', 'care:resolve', 
        'care:evidence:read', 'care:evidence:edit', 'care:comment:edit'],
    FAMILY: [
        'user:read', 'user:invite', 'user:delete' ,'budget:read', 'budget:edit', 'budget:comment:read', 
        'care:evidence:read', 'care:comment:read', 'notif:read', 'notif:edit', 'notif:sent'],
    LEGAL: [
        'user:read', 'user:invite', 'user:delete', 'budget:read', 'budget:edit', 'budget:comment:read', 
        'care:evidence:read', 'care:comment:read', 'notif:read', 'notif:edit', 'notif:sent'],
};




