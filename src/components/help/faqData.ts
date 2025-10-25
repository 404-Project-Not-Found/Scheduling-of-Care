/**
 * FAQ data model and content (Q&A style focused on “how to go to / edit / what does this mean”).
 * - All sign-up related FAQs live under the pre-login "faq/*" keys.
 * - Role-based pages contain only post-login content.
 */

export type FAQSection = {
  id: string; // anchor id (e.g., "faq-login", "family-client-schedule")
  title: string; // section title
  subtitle?: string; // optional small subtitle
  body?: string | string[]; // Q&A paragraphs (e.g., "Q: ...", "A: ...")
  image?: string; // optional screenshot filename (NOT rendered)
  table?: string[][]; // optional simple table (kept for compatibility)
};

export type FAQPage = {
  title: string; // page title shown in the panel header
  sections: FAQSection[];
};

export type FAQBook = Record<string, FAQPage>;


/* ====================================================================
 * FAQ content
 * ==================================================================== */


export const faqData: FAQBook = {
  /* =========================
   * PRE-LOGIN (split into multiple pages, titles cleaned)
   * ========================= */

  // Login
  'prelogin/login': {
    title: 'Login',
    sections: [
      {
        id: 'login',
        title: 'Login to your account',
        body: [
          'Q: How do I log in?',
          'A: On the login page, enter your email and password, then click “Sign In”.',
          'Q: What if I forgot my password?',
          'A: Click “Forgot password” to receive a reset link by email.',
        ],
      },
    ],
  },

  // Role select
  'prelogin/role': {
    title: 'Role Selection',
    sections: [
      {
        id: 'role-select',
        title: 'Select a role (on /signup)',
        body: [
          'Q: What happens after I click “Sign Up”?',
          'A: You’ll be asked to choose a role: Family/POA, Carer, or Management.',
          'Q: Which role should I choose?',
          'A: If you want care to look after your client, choose Family/POA. If you are a care worker in an organisation and got an invite code from your manager, choose Carer. If you manage an organisation, choose Management.',
          'Q: Can I change my role later?',
          'A: You can sign out and sign up again with a different role, or use separate accounts. But once an account is created, its role cannot be changed.',
        ],
      },
    ],
  },

  // Family signup
  'prelogin/signup-family': {
    title: 'Sign Up — Family / POA',
    sections: [
      {
        id: 'signup-family',
        title: 'Sign Up — Family / POA',
        body: [
          'Q: How do I sign up as Family/POA?',
          'A: On the role selection screen, choose “Family/POA” and fill in your details.',
          'Q: What does “Submit” do?',
          'A: It creates your Family/POA account and redirects you to the Login page, then click on "Login" to enter.',
          'Q: What if my email is already registered?',
          'A: Enter your password directly to login. If you forgot your password, go back to the login page and click on “Forgot password” and you will receive an email with instructions to reset it.',
        ],
      },
    ],
  },

  // Carer signup
  'prelogin/signup-carer': {
    title: 'Sign Up — Carer',
    sections: [
      {
        id: 'signup-carer',
        title: 'Sign Up — Carer',
        body: [
          'Q: How do I sign up as Carer?',
          'A: On the role selection screen, choose “Carer” and complete the registration form.',
          'Q: What is the Service Provider Invite Code?',
          'A: It is the code provided to you by the Service Provider. Please contact them if you do not have an Invite code. You will be unable join the Service Provider otherwise',
          'Q: What does “Submit” do?',
          'A: It finalises your Carer account and opens your dashboard.',
          'Q: Can I see all clients?',
          'A: Carers only see clients assigned by the organisation.',
        ],
      },
    ],
  },

  // Management: choose org flow
  'prelogin/mgmt-org-choice': {
    title: 'Management — Create or Join Organisation',
    sections: [
      {
        id: 'mgmt-org-choice',
        title: 'Management — Create or Join an Organisation',
        body: [
          'Q: I chose Management — what’s next?',
          'A: You’ll pick whether to create a new organisation or join an existing one using an invite code.',
          'Q: What does “Create” do?',
          'A: Register a new organisation and become its first manager.',
          'Q: What does “Join” do?',
          'A: Adds you to an existing organisation using an invite code provided by the management team.',
        ],
      },
    ],
  },

  // Management signup
  'prelogin/signup-management': {
    title: 'Sign Up — Management',
    sections: [
      {
        id: 'signup-management',
        title: 'Sign Up — Management',
        body: [
          'Q: How do I sign up as Management?',
          'A: After choosing Management, complete the organisation details (register or join). Note that if you are joining an organisation as a management staff member, you require an invite code from the Service Provider.',
          'Q: What does “Submit” do?',
          'A: It registers your organisation account and enables management features. You can then login as management but if you are starting a new service provider, you will have an empty dashboard with no details of clients or staff. Register clients and staff to see more information',
          'Q: Can I invite other management users?',
          'A: Yes. Once logged in, go to your Organisation page to invite other managers and carers in your organisation.',
        ],
      },
    ],
  },

  /* =========================
   * FAMILY (post-login)
   * ========================= */

  'family/dashboard': {
    title: 'Family / POA — Dashboard',
    sections: [
      {
        id: 'family-dashboard-overview',
        title: 'Main Dashboard',
        body: [
          'Q: What does the main dashboard do?',
          'A: To choose either “Manage My PWSN Care” to view my PWSNs or “View Staff Schedule” to view the service provider’s staff schedules.',
          'Q: What do the “View Staff Schedule” options do?',
          'A: They show staff shifts of the service providers who take care of your PWSN.',
          'Q: What do the “Manage My PWSN Care” options do?',
          'A: They allow you to monitor and manage care schedules for your PWSN.',
          'Q: How can I manage my account and password?',
          'A: Click the profile icon at the top right corner of the page to access your account settings and password options.'
        ],
      },
    ],
  },

  'family/client-schedule': {
    title: 'Family / POA — PWSN Care Schedule',
    sections: [
      {
        id: 'family-client-schedule',
        title: 'Calendar view of your PWSN’s Care schedule',
        body: [
          'Q: What does the "Care Schedule" page show?',
          'A: It displays care items scheduled in the selected month for the selected PWSN.',
          'Q: What do the “Left/Right” arrows on top of the calendar do?',
          'A: They move the calendar backward/forward by one month.',
          'Q: How do I select a different month?',
          'A: Click the calendar icon next to the title to open a month picker.',
          'Q: What does the pink-highlighted number on the calendar represent?',
          'A: It’s the current day. Click it to see all care items for the current month.',
          'Q: What does the blue-highlighted number represent?',
          'A: It indicates a day with care items. Click it to see the care items for that day.',
          'Q: What does the “Select a PWSN” dropdown do?',
          'A: Changes which PWSN’s schedule is displayed.',
          'Q: How can I view the detail of a care item?',
          'A: Clink on the care item that you want to view shwon on the right hand-side list under "All care items". It opens details for that care item, including last done, next due, frequency, status, comments, and files.',
          'Q: How do I search for a specific care item?',
          'A: Use the search bar to find care items by typing keywords.',
          'Q: What does the “Users with access” dropdown do?',
          'A: Shows who has access to this PWSN’s schedule (include this person‘s other family member/power of attorney and service privider‘s management and staff/carer).',
          'Q: What does the “Print” button do?',
          'A: Opens the print dialog for the current page and allows you to print the content shown on this page.',
          'Q: I cannot see any items. Why?',
          'A: Check that a person on the topleft PWSN name dropdown is selected.',
        ],
      },
      {
        id: 'family-menu-summary',
        title: 'Menu options (top navigation)',
        subtitle: 'Quick reference for common pages you can access.',
        body: [
          'Q: How do I go to my main dashboard?',
          'A: Click the arrow at the top-left to return to the main dashboard.',
          'Q: How do I go to the care item schedule for a PWSN?',
          'A: Click “Care Schedule”, then select a PWSN to view their calendar.',
          'Q: How do I view all of my PWSN and edit a PWSN’s personal information?',
          'A: Click “My PWSN”, select a person, then click on "edit profile" to edit details. Otherwise.',
          'Q: How do I manage service provider access for a PWSN?',
          'A: Click “PESN Service Provider” to approve/reject access requests, revoke current access, or review access history.',
          'Q: How do I view a PWSN’s annual budget and drill into categories?',
          'A: Click “Budget Report”, choose a year, then click a category to see its care items.',
          'Q: How do I see to the transaction history for care items',
          'A: Click “View Transaction” to see receipts uploaded by carers, including dates and status.',
          'Q: How do I submit a change request for a care item?',
          'A: Click "Family Reuqest", fill in the required information, and click on "submit", then it will goes to Management automatically.',
          'Q: How do I update my account details or sign out?',
          'A: Click your avatar (top right of the page) to open account settings or sign out.',
          'Q: How can I print all information on this page?',
          'A: Each page has a “Print” button below your top right avatar to open the system print dialog.',
        ],
      },
    ],
  },

  'family/my-clients': {
    title: 'Family / POA — My PWSN',
    sections: [
      {
        id: 'family-my-clients',
        title: 'Manage and add new Person with special needs',
        body: [
          'Q: What does "My PWSN List" mean?',
          'A: It shows all the family members or loved ones you wish the service provider to provide special care for them.',
          'Q: What does the button "add new PWSN" mean?' ,
          'A: It allows add new family memebers or loved ones you wish the service to provide special care for them.',
          'Q: What does “Update PWSN Profile" do (per row)?',
          'A: Opens that PWSN’s profile for editing their personal information',
          'Q: What does “Manage Organisation Access” do (per row)?',
          'A: It goes to the page where you can manage which service provider you want give or revoke access to this person, to allow or restrict them see this person‘s details and schedule care items',
          'Q: How do I go to my main dashboard?',
          'A: Click the arrow at the top-left to return to the main dashboard.',
        ],
      },
    ],
  },

  'family/client-profile': {
    title: 'Family / POA — PWSN Profile',
    sections: [
      {
        id: 'family-client-profile',
        title: 'Create or update a profile',
        body: [
          'Q: Why do I see “Access code” on the profile?',
            'A: The numeric access code links this person’s personal information; It allows you to give any service provider access to this person’s personal information: copy the code and send it to them via email, text message, or in person.',
          'Q: How do I add new PWSN and grant access to a service privider if they don’t have an access code?',
          'A: Click “Create one here” to generate an access code, then copy and save it with the profile.',
          'Q: What does “Save” do?',
          'A: Save all profile changes for the PSWN.',
        ],
      },
      {
        id: 'family-access-code',
        title: 'Create new access code',
        body: [
          'Q: What is an access code?',
          'A: It’s a unique personal token for that PWSN, used to link their data and personal information. Keep it private unless you want to someone get access to this PWSN‘s personal information',
          'Q: How do I create a new access code for a PWSN?',
          'A: Click “Create access code” under the access code field, then click “Generate” to get a new code; copy and paste it into the access code field.',
          'Q: What does “Copy” do?',
          'A: Clicking it copies the generated code to your clipboard, then paste it into the access code field and save.',
          'Q: How can I paste the code into the access code field?',
          'A: Click the access code field or anywhere you can type, then use Ctrl+V (for Windows) or Cmd+V (for Mac) to paste, or right-click and select “Paste”.',
        ],
      },
    ],
  },

  'family/organisation-access': {
    title: 'Family / POA — Organisation Access',
    sections: [
      {
        id: 'family-organisation-access',
        title: 'Manage Service Provider access',
        body: [
          'Q: How do I manage Service Provider‘s access for a specific person?',
          'A: On the “PWSN Service Provider” page, use “Select a PWSN” dropdown on the top right to pick the person, then click on "approve/reject" requests or "revoke" to manage access as needed.',
          'Q: What does “Approve” do?',
          'A: Grants the requesting service provider to this person’s personal information and schedule care item.',
          'Q: What does “Reject” do?',
          'A: Denies the access request from that service provider for the selected PWSN.',
          'Q: What does “Revoke” do?',
          'A: Removes existing service provider access for the selected PWSN.',
          'Q: Where can I see access history?',
          'A: Service provider that previously have access to this PWSN but no longer do will be listed under the "Service Providers whose Access is Revoked" section".',
        ],
      },
    ],
  },

  'family/budget-report': {
    title: 'Family / POA — Budget Report',
    sections: [
      {
        id: 'family-budget-report',
        title: 'Annual budget & Category budget',
        body: [
          'Q: What does the "Budget Report" page do?',
          'A: This page shows your PWSN‘s annual budget, remaining balance, how much money spent to date and a budget surplus of the year. Select the year that you want to view',
          'Q: How do I drill into a category’s care items?',
          'A: Click the category to view budget for sub-element.',
          'Q: What does the “Year” selector do?',
          'A: Changes the reporting year.',
        ],
      },
    ],
  },

  'family/view-transaction': {
    title: 'Family / POA — View Transactions',
    sections: [
      {
        id: 'family-view-transactions',
        title: 'All receipts uploaded by carers',
        body: [
          'Q: What does the "View Transactions" page do?',
          'A: You can view and search all receipts on this page; Status shows pending (haven‘t been seen by the service provider’s management) or implemented (checked by the service provider’s management)',
          'Q: How do I search for a specific receipt?',
          'A: Use the search bar on the top right of the page to find receipts by typing keywords.',
        ],
      },
    ],
  },

  'family/request-form': {
    title: 'Family / POA — Family reuqest',
    sections: [
      {
        id: 'family-request-form',
        title: 'Submit a change request',
        body: [
          'Q: What does the "Family Reuqest" page do?',
          'A: You can send a change request for a care item to the service provider’s management by clicking on "Add new request".',
          'Q: What should I do after click on "add new request"?',
          'A: Fill in all required information and click "submit", then it will sends your change request to the service provider’s management automatically for review.',
          'Q: What does “Cancel/Close” do?',
          'A: Dismisses the form without sending a request.',
        ],
      },
    ],
  },

  // Family / POA — Update Details
  'family/update-details': {
    title: 'Family / POA — Manage Account',
    sections: [
      {
        id: 'family-update-details',
        title: 'Manage your account details',
        body: [
          'Q: What does the "Update Details" page do?',
          'A: It lets you change your email and password for this Family/POA account.',
          'Q: What is this password for?',
          'A: It’s the password for this Family/POA account, use to log in to this account and manage your PWSN.',
          'Q: Whose email address is this?',
          'A: It’s the email you (as a Family/POA) use to log in to this account and manage your PWSN.',
        ],
      },
    ],
  },

  'family/staff-schedule': {
    title: 'Family — Staff Schedule',
    sections: [
      {
        id: 'family-staff-schedule',
        title: 'Staff Schedules',
        body: [
          'Q: What does the "Staff Schedule" page do?',
          'A: It displays the weekly shifts of all staff members from your PWSN’s service provider.',
          'Q: Can I search for a specific staff member?',
          'A: Yes. Use the search bar at the top of the Staff column to quickly find a staff member by name.',
          'Q: How can I print the schedule?',
          'A: Click the “Print” button at the top right of the page to download or print the current week’s staff schedule.',
        ],
      },
    ],
  },

  /* =========================
   * CARER (post-login)
   * ========================= */

  'carer/dashboard': {
    title: 'Carer — Dashboard',
    sections: [
      {
        id: 'carer-dashboard-overview',
        title: 'Choose a view',
        body: [
          'Q: How do I switch between staff and client schedules?',
          'A: On the main dashboard, choose either “Staff Schedule” or “Manage Client care”.',
          'Q: What do the “Staff Schedule” / “Manage Client care” options do?',
          'A: They switch the main calendar view to show staff schedule of your co-workers vs. client schedule and all the care items.',
          'Q: How can I manage my account and password?',
          'A: Click the profile icon at the top right corner of the page to access your account settings and password options.'
        ],
      },
    ],
  },

  'carer/client-schedule': {
    title: 'Carer — Client Schedule',
    sections: [
      {
        id: 'carer-client-schedule',
        title: 'Calendar view of your assigned clients',
        body: [
          'Q: What does the calendar show?',
          'A: It displays care items scheduled in the selected month for the selected (assigned) client. The days are highlighted in blue',
          'Q: How do I switch the client I am viewing?',
          'A: Use “Select a client” (or the Assigned client dropdown) to choose another client you are assigned to.',
          'Q: What do the Prev/Next (Left/Right) arrows do?',
          'A: They move the calendar backward/forward by one month.',
          'Q: How do I select a different month directly?',
          'A: Click the calendar icon next to the title to open a month picker.',
          'Q: What happens when I click a care item?',
          'A: The details open, showing last done, next due, frequency, status, comments, and files.',
          'Q: How do I mark a care item as completed?',
          'A: Open the item and click “Mark as completed”; add notes/files, then save. Carers must add comments and files before marking as complete. Once marked, management will be notified and will verify completion',
          'Q: How do I upload receipts',
          'A: Click on "Go to Transactions" at the bottom of the panel when you click on a care item',
          'Q: Can I print this schedule?',
          'A: Yes. Click the “Print” button below the topright avatar.',
        ],
      },
    ],
  },

  'carer/client-profile': {
    title: 'Carer — Client Profile',
    sections: [
      {
        id: 'carer-client-profile',
        title: 'View and add client notes',
        body: [
          'Q: How do I view a client and add notes?',
          'A: Open the client profile to see their picture, name, DOB, personal information, contact information and medical history. Click a field to type and then save the notes',
          'Q: What does “Save notes” do?',
          'A: Saves your newly added or edited notes to the client profile.',
          'Q: Who can see my notes?',
          'A: Notes are visible to permitted roles (e.g., Management/Family/POA) per organisation policy.',
        ],
      },
    ],
  },

  'carer/update-details': {
    title: 'Carer — Update Details',
    sections: [
      {
        id: 'carer-update-details',
        title: 'Manage your account details',
        body: [
          'Q: What does the "Update Details" page do?',
          'A: It lets you change your email and password for this Carer account.',
          'Q: What is this password for?',
          'A: It’s the password for this Carer account, use to log in to this account and manage your client.',
          'Q: Whose email address is this?',
          'A: It’s the email you (as a Carer) use to log in to this account and manage your client.',
        ],
      },
    ],
  },

  'carer/budget-report': {
    title: 'Carer — Budget Report',
    sections: [
      {
        id: 'carer-budget-report',
        title: 'Annual budget & Category budget',
        body: [
          'Q: How do I view yearly budget and remaining balance?',
          'A: Click on “Budget Report” on the top panel of the Client Schedule page to see total budget, spent to date, remaining balance, budget surplus and all the care item categories and their allocated budgets.',
          'Q: How do I drill into category or item-level spend?',
          'A: Click a category to see its sub-elements (care items) and details of the budget allocated to it.',
          'Q: What does the “Year” selector do?',
          'A: Changes the reporting year for the budget figures.',
          'Q: What does the search bar do?',
          'A: You can search for different categories in the Budget report',
        ],
      },
    ],
  },

  'carer/view-transactions': {
    title: 'Carer — View Transactions',
    sections: [
      {
        id: 'carer-view-transactions',
        title: 'Receipts & file management',
        body: [
          'Q: How do I review and upload transactions?',
          'A: Click on “View Transactions” on the top panel of the Client Schedule page to see purchases/refunds, who uploaded them, and any linked care items. Use the upload flow to add new transactions and attach receipts.',
          'Q: What does “Add new transaction” do?',
          'A: Starts a new transaction entry where you can fill out details such as Transaction type, Date of transaction, who the transaction was made by, any notes, upload the receipt, and then add care items purchased (can be multiple care items, choose the category, the care item and the amount paid. Once submitted, it will appear in the transcation history for Family and Management to see.',
          'Q: What does “Upload receipt” do?',
          'A: Lets you upload images/PDFs and associate them with the transaction.',
          'Q: How do I log a refund?',
          'A: Follow the same steps as you did for the purchase form but choose the purchase occurence at the end',
          
        ],
      },
    ],
  },

  'carer/request-log-page': {
    title: 'Carer — Family Requests',
    sections: [
      {
        id: 'carer-request-log-page',
        title: 'Family Requests log',
        body: [
          'Q: What is this page for?',
          'A: It allows you to view requests made by family/POA of the client with details of the care item, what the requested change was, who it was requested by, the date it was requested, the status of the request, and if the request has been implemented, the resolution date',
        ],
      },
    ],
  },

  'carer/staff-schedule': {
    title: 'Carer — Staff Schedule',
    sections: [
      {
        id: 'carer-staff-schedule',
        title: 'Staff Schedules',
        body: [
          'Q: What does the "Staff Schedule" page do?',
          'A: It lets you view the schedules of your fellow staff members (carers and management).',
        ],
      },
    ],
  },

  /* =========================
   * MANAGEMENT (post-login)
   * ========================= */

  'management/dashboard': {
    title: 'Management — Main Dashboard',
    sections: [
      {
        id: 'management-dashboard-overview',
        title: 'Switch between Client Care and Staff Schedule',
        body: [
          'Q: What happens when I click "Manage Client Care"?',
          'A: You’ll open the Client Schedule Management page to view a client’s calendar, see care items, and manage scheduling for client.',
          'Q: What happens when I click "Manage Staff Care"?',
          'A: You’ll open the Staff Shift Management page to view all staff schedules, and assign shifts.',
          'Q: How can I manage my account and password?',
          'A: Click the profile icon at the top right corner of the page to access your account settings and password options.'
        ],
      },
    ],
  },

  'management/client-schedule': {
    title: 'Management — Client Schedule',
    sections: [
      {
        id: 'management-client-schedule',
        title: 'Client Schedules',
        body: [
          'Q: What does the calendar show?',
          'A: It displays care items scheduled in the selected month for the selected (assigned) client.',
          'Q: How do I switch the client I am viewing?',
          'A: Use “Select a client” (or the Assigned client dropdown) to choose another client you are assigned to.',
          'Q: What do the Prev/Next (Left/Right) arrows do?',
          'A: They move the calendar backward/forward by one month.',
          'Q: How do I select a different month directly?',
          'A: Click the calendar icon next to the title to open a month picker.',
          'Q: What happens when I click a care item?',
          'A: The details open, showing last done, next due, frequency, status, comments, and files.',
          'Q: How do I mark a care item as completed?',
          'A: Open the item and click “Mark as completed”; add notes/files if required, then save.',
          'Q: Can I print this schedule?',
          'A: Yes. Click the “Print” button near the header.',
        ],
      },

      {
        
        id: 'management-client-schedule-colours-status',
        title: 'Calendar colours & status',
        body: [
        'Q: What do the blue and red highlights mean?',
        'A: Red marks today’s date. Blue marks days that have one or more scheduled or due care items in the selected month.',
        'Q: What do the status tags (Overdue, Completed, Due) mean?',
        'A: Overdue = date has passed and the item is not yet completed. Completed = item has been marked done. Due = item is upcoming and not yet completed.',
        'Q: What does "Users with Client Access" show?',
        'A: A quick list of users who currently have permission to view or manage this client.',
        ],
        
      }
    ],
  },

  'management/client-list': {
    title: 'Management — Client List',
    sections: [
      {
        id: 'client-list',
        title: 'Manage your Clients',
        body: [
          'Q: How do I register a new client?',
          'A: Go to “Client List”, click “Add Client”, and fill in the required details.',
        ],
      },

      {
        id: 'client-list-access-status',
        title: 'Access status',
        body: [
        'Q: What does "Approved" mean?',
        'A: Your organisation currently has active access to the client’s records and can manage their schedule.',
        'Q: What does "Pending" mean?',
        'A: The client is registered and access is awaiting approval from the family member or Power of Attorney (POA).',
        'Q: What does "Revoked" mean?',
        'A: The client is no longer under your organisation’s care and access has been removed.',
      ],
      }
    ],
  },

  'management/add-care-items': {
    title: 'Management — Manage Care Items',
    sections: [
      {
        id: 'add-care-item',
        title: 'Add and Edit Care Items',
        body: [
          'Q: How do I add or edit a care item template for clients?',
          'A: Go to “Care Items”, create a new template by click on "add care item" or edit an existing one by click on "edit care item". Please fill in all required fields on this page and then click on "add" or "save".',
          'Q: Can I import items from CSV?',
          'A: If enabled by your organisation, use the “Import” option on the Care Items page.',
        ],
      },
    ],
  },

  'management/view-transactions': {
    title: 'Management — View Transactions',
    sections: [
      {
        id: 'mgmt-transactions',
        title: 'View receipts uploaded by carers',
        body: [
          'Q: How do I review receipts uploaded by carers?',
          'A: Click the file name to automatically download it in your browser.',
          'Q: How can I find a receipt for specific care item?',
          'A: Type the keywords for that care item into the top-right search bar to search.'
        ],
      },
    ],
  },

  'management/budget-report': {
    title: 'Management — Budget Report',
    sections: [
      {
        id: 'mgmt-budget',
        title: 'Annual budget & Category budget',
        body: [
          'Q: How do I monitor budget utilisation across clients?',
          'A: Open “Budget Report”, pick a year, and review totals, spent to date, and remaining balances per client or category.',
          'Q: How do I drill into overspend risks?',
          'A: Click a category/client row to view item-level spend and trends.',
          'Q: How do I drill into category or item-level spend?',
          'A: Click a category to see its sub-elements (care items) and details of the budget allocated to it.',
          'Q: What does the “Year” selector do?',
          'A: Changes the reporting year for the budget figures.',
          'Q: What does the search bar do?',
          'A: You can search for different categories in the Budget report',
        ],
      },
    ],
  },

  'management/request-log': {
    title: 'Management — Request from Family Member/POA of clients',
    sections: [
      {
        id: 'mgmt-request-log',
        title: 'Requests Log Page',
        body: [
          'Q: What is this page for?',
          'A: It allows you to view requests made by family/POA of the client with details of the care item, what the requested change was, who it was requested by, the date it was requested, the status of the request, and if the request has been implemented, the resolution date',
          'Q: What does it mean when the status is set to Pending?',
          'A: "Pending" means a family member has submitted a request, but it has not yet been actioned by your organisation.',
          'Q: What does it mean when the status is set to Implemented?',
          'A: "Implemented" means your organisation or any staff/carer has completed the request and updated the related care item in the system. Once it’s set to "Implemented", the family member can see the status change and know their request has been implemented.',
        ],
      },
    ],
  },

  'management/client-profile': {
    title: 'Management — Client Profile',
    sections: [
      {
        id: 'mgmt-client-profile',
        title: 'view client details',
        body: [
          'Q: Who‘s profile is this?',
          'A: The client you currently have selected and their name are shown in the center of the pink banner.',
          'Q: Can I change anything on thus page?',
          'A: No, only a family member can update this page on behalf of the client. As a organisation manager, you can only view this page.',
        ],
      },
    ],
  },


  'management/update-details': {
    title: 'Management — Manage your account',
    sections: [
      {
        id: 'management-update-details',
        title: 'Manage your account details',
        body: [
          'Q: What does the "Manage your account" page do?',
          'A: It lets you change your email and password for this Management account.',
          'Q: What is this password for?',
          'A: It’s the password for this Management account, use to log in to this account and manage your client.',
          'Q: Whose email address is this?',
          'A: It’s the email you (as a Management) use to log in to this account and manage your client.',
        ],
      },
    ],
  },

  'management/staff-schedule': {
    title: 'Management — Staff Schedule',
    sections: [
      {
        id: 'management-staff-schedule',
        title: 'Manage staff schedules',
        body: [
          'Q: What does the "Staff Schedule" page do?',
          'A: It lets you view and manage the schedules of all staff members.',
          'Q: What does "Manage staff" do?',
          'A: It will go to the staff list oage where you can invite new staff or removing existing staff.',
          'Q: What does "Shift Settings" do?',
          'A: You can customize the time period of the shift.',
          'Q: What does "Print" do?',
          'A: You can print the content of this current page, the staff schedule for the week you are currently viewing.',
        ],
      },
    ],
  },

  'management/staff-list': {
    title: 'Management — Staff List',
    sections: [
      {
        id: 'management-staff-list',
        title: 'View staff members',
        body: [
          'Q: What does the "Staff List" page do?',
          'A: It lets you view and manage the details of all staff members.',
          'Q: How do I add a new staff member?',
          'A: Click the “Generate Staff Invite Code” button. After clicking “Generate”, copy the generated code and send it to your organisation’s staff. They can use this code to sign up for a new account, then their name and details will automatically appear on this list.',
        ],
      },
    ],
  },
};

