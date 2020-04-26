/**
 * User permission policies.
 * Can be used with `hasPermission` method.
 *
 * PERMISSION GUIDELINES
 *
 * All the permission name and meaning should define **WHAT** can be done having such permission
 * but not **WHO** can do it.
 *
 * Examples of CORRECT permission naming and meaning:
 *    - `READ_PROJECT`
 *    - `UPDATE_MILESTONE`
 *    - `DELETE_WORK`
 *
 * Examples of INCORRECT permissions naming and meaning:
 *    - `COPILOT_AND_MANAGER`
 *    - `PROJECT_MEMBERS`
 *    - `ADMINS`
 *
 * The same time **internally only** in this file, constants like `COPILOT_AND_ABOVE`,
 * `PROJECT_MEMBERS`, `ADMINS` could be used to define permissions.
 *
 * NAMING GUIDELINES
 *
 * There are unified prefixes to indicate what kind of permissions.
 * If no prefix is suitable, please, feel free to use a new prefix.
 *
 * CREATE_ - create somethings
 * READ_   - read something
 * UPDATE_ - update something
 * DELETE_ - delete something
 *
 * MANAGE_ - means combination of 3 operations CREATE/UPDATE/DELETE.
 *           usually should be used, when READ operation is allowed to everyone
 *           while 3 manage operations require additional permissions
 * ACCESS_ - means combination of all 4 operations READ/CREATE/UPDATE/DELETE.
 *           usually should be used, when by default users cannot even READ something
 *           and if someone can READ, then also can do other kind of operations.
 *
 * ANTI-PERMISSIONS
 *
 * If it's technically impossible to create permission rules for some situation in "allowed" manner,
 * in such case we can create permission rules, which would disallow somethings.
 * - Create such rules ONLY IF CREATING ALLOW RULE IS IMPOSSIBLE.
 * - Add a comment to such rules explaining why allow-rule cannot be created.
 */
import _ from 'lodash';
 import {
  PROJECT_MEMBER_ROLE,
  PROJECT_MEMBER_MANAGER_ROLES,
  ADMIN_ROLES as TOPCODER_ROLES_ADMINS,
  USER_ROLE,
  MANAGER_ROLES as TOPCODER_ROLES_MANAGERS_AND_ADMINS,
  M2M_SCOPES,
} from '../constants';

const SCOPES_PROJECTS_READ = [
  M2M_SCOPES.CONNECT_PROJECT_ADMIN,
  M2M_SCOPES.PROJECTS.ALL,
  M2M_SCOPES.PROJECTS.READ,
];

const SCOPES_PROJECTS_WRITE = [
  M2M_SCOPES.CONNECT_PROJECT_ADMIN,
  M2M_SCOPES.PROJECTS.ALL,
  M2M_SCOPES.PROJECTS.WRITE,
];

const SCOPES_PROJECT_MEMBERS_READ = [
  M2M_SCOPES.CONNECT_PROJECT_ADMIN,
  M2M_SCOPES.PROJECT_MEMBERS.ALL,
  M2M_SCOPES.PROJECT_MEMBERS.READ,
];

const SCOPES_PROJECT_MEMBERS_WRITE = [
  M2M_SCOPES.CONNECT_PROJECT_ADMIN,
  M2M_SCOPES.PROJECT_MEMBERS.ALL,
  M2M_SCOPES.PROJECT_MEMBERS.WRITE,
];

const TOPCODER_ROLES_ALL = _.values(USER_ROLE);

const ALL = true;

export const PERMISSION = { // eslint-disable-line import/prefer-default-export
  /*
   * Project
   */
  CREATE_PROJECT: {
    meta: {
      title: 'Create Project',
      group: 'Project',
    },
    topcoderRoles: ALL,
    scopes: SCOPES_PROJECTS_WRITE,
  },

  CREATE_PROJECT_AS_MANAGER: {
    meta: {
      title: 'Create Project as a "manager"',
      group: 'Project',
      description: `When user creates a project they become a project member.
        If user has this permission they would join project with "${PROJECT_MEMBER_ROLE.MANAGER}"
        project role, otherwise with "${PROJECT_MEMBER_ROLE.CUSTOMER}".`,
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    scopes: SCOPES_PROJECTS_WRITE,
  },

  READ_PROJECT: {
    meta: {
      title: 'Read Project',
      group: 'Project',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    projectRoles: ALL,
    scopes: SCOPES_PROJECTS_READ,
  },

  READ_PROJECT_ANY: {
    meta: {
      title: 'Read Any Project',
      group: 'Project',
      description: 'Read any project, even when not a member.',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    scopes: SCOPES_PROJECTS_READ,
  },

  UPDATE_PROJECT: {
    meta: {
      title: 'Update Project',
      group: 'Project',
      description: 'There are additional limitations on editing some parts of the project.',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    projectRoles: ALL,
    scopes: SCOPES_PROJECTS_WRITE,
  },

  UPDATE_PROJECT_DIRECT_PROJECT_ID: {
    meta: {
      title: 'Update Project property "directProjectId"',
      group: 'Project',
    },
    topcoderRoles: [
      USER_ROLE.MANAGER,
      USER_ROLE.TOPCODER_ADMIN,
    ],
    scopes: SCOPES_PROJECTS_WRITE,
  },

  DELETE_PROJECT: {
    meta: {
      title: 'Delete Project',
      group: 'Project',
      description: 'Has different set of permission unlike to update.',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    projectRoles: [
      // primary customer user, usually the one who created the project
      { role: PROJECT_MEMBER_ROLE.CUSTOMER, isPrimary: true },
      PROJECT_MEMBER_ROLE.MANAGER,
      PROJECT_MEMBER_ROLE.PROGRAM_MANAGER,
      PROJECT_MEMBER_ROLE.PROJECT_MANAGER,
      PROJECT_MEMBER_ROLE.SOLUTION_ARCHITECT,
    ],
    scopes: SCOPES_PROJECTS_WRITE,
  },

  /*
   * Project Member
   */
  READ_PROJECT_MEMBER: {
    meta: {
      title: 'Read Project Member',
      group: 'Project Member',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    projectRoles: ALL,
    scopes: SCOPES_PROJECT_MEMBERS_READ,
  },

  READ_PROJECT_MEMBER_DETAILS: {
    meta: {
      title: 'Read Project Member Details',
      group: 'Project Member',
      description: 'Who can see user details (PII) like email, first name and last name.',
    },
    topcoderRoles: [
      USER_ROLE.TOPCODER_ADMIN,
    ],
    scopes: SCOPES_PROJECT_MEMBERS_READ,
  },

  CREATE_PROJECT_MEMBER: {
    meta: {
      title: 'Create Project Member',
      group: 'Project Member',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    projectRoles: ALL,
    scopes: SCOPES_PROJECT_MEMBERS_WRITE,
  },

  CREATE_PROJECT_MEMBER_FOR_OTHERS: {
    meta: {
      title: 'Create Project Member (for other users)',
      group: 'Project Member',
      description: 'Who can add other users as project members.',
    },
    topcoderRoles: TOPCODER_ROLES_ADMINS,
    scopes: SCOPES_PROJECT_MEMBERS_WRITE,
  },

  UPDATE_PROJECT_MEMBER: {
    meta: {
      title: 'Update Project Member',
      group: 'Project Member',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    projectRoles: ALL,
    scopes: SCOPES_PROJECT_MEMBERS_WRITE,
  },

  UPDATE_PROJECT_MEMBER_NON_CUSTOMER: {
    meta: {
      title: 'Update Project Member (non-customer)',
      group: 'Project Member',
      description: 'Who can update project members with non "customer" role.',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    scopes: SCOPES_PROJECT_MEMBERS_WRITE,
  },

  UPDATE_PROJECT_MEMBER_TO_COPILOT: {
    meta: {
      title: 'Update Project Member (to copilot)',
      group: 'Project Member',
      description: 'Who can update project member role to "copilot".',
    },
    topcoderRoles: [
      ...TOPCODER_ROLES_ADMINS,
      USER_ROLE.COPILOT_MANAGER,
    ],
    scopes: SCOPES_PROJECT_MEMBERS_WRITE,
  },

  DELETE_PROJECT_MEMBER: {
    meta: {
      title: 'Delete Project Member',
      group: 'Project Member',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    projectRoles: ALL,
    scopes: SCOPES_PROJECT_MEMBERS_WRITE,
  },

  DELETE_PROJECT_MEMBER_NON_CUSTOMER: {
    meta: {
      title: 'Delete Project Member (non-customer)',
      group: 'Project Member',
      description: 'Who can delete project members with non "customer" role.',
    },
    topcoderRoles: TOPCODER_ROLES_MANAGERS_AND_ADMINS,
    scopes: SCOPES_PROJECT_MEMBERS_WRITE,
  },

  /**
   * Permissions defined by logic: **WHO** can do actions with such a permission.
   */
  ROLES_COPILOT_AND_ABOVE: {
    topcoderRoles: TOPCODER_ROLES_ADMINS,
    projectRoles: [
      PROJECT_MEMBER_ROLE.PROGRAM_MANAGER,
      PROJECT_MEMBER_ROLE.SOLUTION_ARCHITECT,
      PROJECT_MEMBER_ROLE.PROJECT_MANAGER,
      PROJECT_MEMBER_ROLE.MANAGER,
      PROJECT_MEMBER_ROLE.COPILOT,
    ],
  },

  /**
   * Permissions defined by logic: **WHAT** can be done with such a permission.
   */

  /*
   * Update invite permissions
   */
  UPDATE_NOT_OWN_INVITE: {
    topcoderRoles: [
      USER_ROLE.TOPCODER_ADMIN,
      USER_ROLE.CONNECT_ADMIN,
    ],
  },

  UPDATE_REQUESTED_INVITE: {
    topcoderRoles: [
      USER_ROLE.TOPCODER_ADMIN,
      USER_ROLE.CONNECT_ADMIN,
      USER_ROLE.COPILOT_MANAGER,
    ],
  },

  /*
   * Delete invite permissions
   */
  DELETE_CUSTOMER_INVITE: {
    topcoderRoles: [
      USER_ROLE.TOPCODER_ADMIN,
      USER_ROLE.CONNECT_ADMIN,
    ],
    projectRoles: ALL,
  },

  DELETE_NON_CUSTOMER_INVITE: {
    topcoderRoles: [
      USER_ROLE.TOPCODER_ADMIN,
      USER_ROLE.CONNECT_ADMIN,
    ],
    projectRoles: PROJECT_MEMBER_MANAGER_ROLES,
  },

  DELETE_REQUESTED_INVITE: {
    topcoderRoles: [
      USER_ROLE.TOPCODER_ADMIN,
      USER_ROLE.CONNECT_ADMIN,
      USER_ROLE.COPILOT_MANAGER,
    ],
  },
};

export const PROJECT_TO_TOPCODER_ROLES_MATRIX = {
  [PROJECT_MEMBER_ROLE.MANAGER]: [
    USER_ROLE.TOPCODER_ADMIN,
    USER_ROLE.CONNECT_ADMIN,
    USER_ROLE.MANAGER,
  ],
  [PROJECT_MEMBER_ROLE.SOLUTION_ARCHITECT]: [
    USER_ROLE.SOLUTION_ARCHITECT,
  ],
  [PROJECT_MEMBER_ROLE.PROJECT_MANAGER]: [
    USER_ROLE.PROJECT_MANAGER,
  ],
  [PROJECT_MEMBER_ROLE.PROGRAM_MANAGER]: [
    USER_ROLE.PROGRAM_MANAGER,
  ],
  [PROJECT_MEMBER_ROLE.ACCOUNT_EXECUTIVE]: [
    USER_ROLE.ACCOUNT_EXECUTIVE,
  ],
  [PROJECT_MEMBER_ROLE.ACCOUNT_MANAGER]: [
    USER_ROLE.MANAGER,
    USER_ROLE.TOPCODER_ACCOUNT_MANAGER,
    USER_ROLE.BUSINESS_DEVELOPMENT_REPRESENTATIVE,
    USER_ROLE.PRESALES,
    USER_ROLE.ACCOUNT_EXECUTIVE,
    USER_ROLE.PROGRAM_MANAGER,
    USER_ROLE.SOLUTION_ARCHITECT,
    USER_ROLE.PROJECT_MANAGER,
  ],
  [PROJECT_MEMBER_ROLE.COPILOT]: [
    USER_ROLE.COPILOT,
  ],
  [PROJECT_MEMBER_ROLE.CUSTOMER]: TOPCODER_ROLES_ALL,
};

/**
 * This list determines default Project Role by Topcoder Role.
 *
 * - The order of items in this list is IMPORTANT.
 * - To determine default Project Role we have to go from TOP to END
 *   and find the first record which has the Topcoder Role of the user.
 * - Always define default Project Role which is allowed for such Topcoder Role
 *   as per `PROJECT_TO_TOPCODER_ROLES_MATRIX`
 */
export const DEFAULT_PROJECT_ROLE = [
  {
    topcoderRole: USER_ROLE.MANAGER,
    projectRole: PROJECT_MEMBER_ROLE.MANAGER,
  }, {
    topcoderRole: USER_ROLE.CONNECT_ADMIN,
    projectRole: PROJECT_MEMBER_ROLE.MANAGER,
  }, {
    topcoderRole: USER_ROLE.TOPCODER_ADMIN,
    projectRole: PROJECT_MEMBER_ROLE.MANAGER,
  }, {
    topcoderRole: USER_ROLE.TOPCODER_ACCOUNT_MANAGER,
    projectRole: PROJECT_MEMBER_ROLE.ACCOUNT_MANAGER,
  }, {
    topcoderRole: USER_ROLE.BUSINESS_DEVELOPMENT_REPRESENTATIVE,
    projectRole: PROJECT_MEMBER_ROLE.ACCOUNT_MANAGER,
  }, {
    topcoderRole: USER_ROLE.PRESALES,
    projectRole: PROJECT_MEMBER_ROLE.ACCOUNT_MANAGER,
  }, {
    topcoderRole: USER_ROLE.COPILOT,
    projectRole: PROJECT_MEMBER_ROLE.ACCOUNT_MANAGER,
  }, {
    topcoderRole: USER_ROLE.ACCOUNT_EXECUTIVE,
    projectRole: PROJECT_MEMBER_ROLE.ACCOUNT_EXECUTIVE,
  }, {
    topcoderRole: USER_ROLE.PROGRAM_MANAGER,
    projectRole: PROJECT_MEMBER_ROLE.PROGRAM_MANAGER,
  }, {
    topcoderRole: USER_ROLE.SOLUTION_ARCHITECT,
    projectRole: PROJECT_MEMBER_ROLE.SOLUTION_ARCHITECT,
  }, {
    topcoderRole: USER_ROLE.PROJECT_MANAGER,
    projectRole: PROJECT_MEMBER_ROLE.PROJECT_MANAGER,
  }, {
    topcoderRole: USER_ROLE.TOPCODER_USER,
    projectRole: PROJECT_MEMBER_ROLE.CUSTOMER,
  },
];
