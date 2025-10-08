/**
 * FAQ data model and content (Q&A style focused on “how to go to / edit / what does this mean”).
 */

export type FAQSection = {
  id: string;                 // anchor id for direct scroll (e.g., "family-login", "carer-add-comment")
  title: string;              // section title
  subtitle?: string;          // optional small subtitle
  body?: string | string[];   // Q&A paragraphs (e.g., "Q: ...", "A: ...")
  image?: string;             // optional screenshot filename (kept for reference; NOT rendered)
  table?: string[][];         // optional simple table (kept for compatibility)
};

export type FAQPage = {
  title: string;              // page title shown in the panel header
  sections: FAQSection[];
};

export type FAQBook = Record<string, FAQPage>;

/* ====================================================================
 * FAQ DATA — no `image` fields present in any section
 * ==================================================================== */

export const faqData: FAQBook = {
  /* =========================
   * FAMILY
   * ========================= */
  'family/welcome-login': {
    title: 'Family / POA — Welcome & Login',
    sections: [
      {
        id: 'family-signup',
        title: 'Sign Up',
        body: [
          'Q: How do I sign up as Family/POA?',
          'A: Click “Sign Up”, choose “Family/Power of Attorney”, and complete the short form.',
          'Q: What does the “Sign Up” button do?',
          'A: It starts account creation for the selected role.',
          'Q: What does the “Continue/Submit” button on the form do?',
          'A: It submits your details and creates your Family/POA account.',
          'Q: I see a warning about unsafe site. What should I do?',
          'A: Click “Details”, then click “Visit this unsafe site” to proceed for demo/testing. Do not enter real personal information.',
          'Q: Can I use a mock/demo account?',
          'A: Yes. Use the mock credentials shown on the login page if available; these accounts don’t store real data.',
        ],
      },
      {
        id: 'family-role-select',
        title: 'Role Selection',
        body: [
          'Q: How do I select the Family/POA role at sign-up?',
          'A: On the role screen, pick “Family/Power of Attorney” before submitting the form.',
          'Q: What does selecting a role do?',
          'A: It configures your account permissions and the menus you will see after login.',
          'Q: Can I change roles later?',
          'A: Yes. Sign out and sign back in with a different role (or use separate test accounts).',
        ],
      },
      {
        id: 'family-signup-form',
        title: 'Sign Up — Create Your Account',
        body: [
          'Q: How do I complete the sign-up form?',
          'A: Enter your basic details and submit; your Family/POA account is created.',
          'Q: What does “Submit” do?',
          'A: Validates input and creates your account if everything is correct.',
          'Q: What does “Cancel/Back” do?',
          'A: It leaves the form without creating an account.',
          'Q: What if the email is already registered?',
          'A: You’ll see a validation message. Try logging in or use “Forgot password”.',
        ],
      },
    ],
  },

  'family/dashboard': {
    title: 'Family / POA — Dashboard & Navigation',
    sections: [
      {
        id: 'family-dashboard-overview',
        title: 'Choose a view',
        body: [
          'Q: How do I switch between staff and client schedules?',
          'A: On the main dashboard, choose either “Staff Schedule” or “Client Schedule”.',
          'Q: What do the “Staff Schedule” / “Client Schedule” options do?',
          'A: They switch the main calendar view to show staff vs. client items.',
          'Q: What happens if no client is selected?',
          'A: You’ll see “No client selected”. Use “Select a client” to pick one before viewing items.',
        ],
      },
      
    ],
  },

  'family/client-schedule': {
    title: 'Family / POA — Client Schedule',
    sections: [
      {
        id: 'family-client-schedule',
        title: 'Calendar view of the client schedule',
        body: [
          'Q: What does the calendar view show?',
          'A: It displays care items scheduled in the selected month for the selected client.',
          'Q: What do the “Left/Right” arrows on top of the calendar do?',
          'A: They move the calendar backward/forward by one month.',
          'Q: How do I select a different month?',
          'A: Click the calendar icon next to the title to open a month picker.',
          'Q: What does the pink-highlighted number represent?',
          'A: It\'s the current day. Click it to see all care items for the current month.',
          'Q: What does the blue-highlighted number represent?',
          'A: It indicates a day with care items. Click it to see the care items for that day.',
          'Q: What does “Select a client” do?',
          'A: Changes which client’s schedule is displayed.',
          'Q: What happens when I click on a care item?',
          'A: It opens details for that care item, including last done, next due, frequency, status, comments, and files.',
          'Q: How do I search for a specific care item?',
          'A: Use the search bar to find care items by typing keywords.',
          'Q: What does the “Users with access” button do?',
          'A: Shows who has access to this client’s schedule (organisations and family/POA).',
          'Q: What does the “Print” button do?',
          'A: Opens the print dialog for the current page.',
          'Q: I cannot see any items. Why?',
          'A: Check that a client is selected and the month contains scheduled items. Use the search bar to confirm.',
        ],
      },

      {
        id: 'family-menu-summary',
        title: 'Menu options (top navigation)',
        subtitle: 'Quick reference for common pages you can access.',
        body: [
          'Q: How do I go to my main dashboard?',
          'A: Click the logo at the top-left to return to the main dashboard.',
          'Q: How do I go to the calendar dashboard for a client?',
          'A: Click “Client Schedule”, then select a client to view their calendar.',
          'Q: How do I go to my client list and edit a client?',
          'A: Click “My Clients”, select a client, then open their profile to edit details or view the schedule.',
          'Q: How do I manage organisation access for a client?',
          'A: Click “Organisation” to approve/reject access requests, revoke current access, or review access history.',
          'Q: How do I view a client’s annual budget and drill into categories?',
          'A: Click “Budget Report”, choose a year, then click a category to see its care items.',
          'Q: How do I go to the transaction history?',
          'A: Click “View Transaction” to see receipts uploaded by carers, including dates and status.',
          'Q: How do I submit a change request for a care item?',
          'A: Open “Request Form”, fill in the requested change, and submit—it goes to Management automatically.',
          'Q: How do I update my account details or sign out?',
          'A: Click your avatar (top banner) to open account settings or sign out.',
          'Q: How do I view and edit my client’s personal details?',
          'A: Click the client avatar (pink banner) to open the client profile and update details.',
          'Q: What does clicking the “Logo” do?',
          'A: Navigates back to the main dashboard from anywhere.',
          'Q: What does the “Client Schedule” button do?',
          'A: Opens the calendar dashboard and lets you pick a client to view.',
          'Q: What does “My Clients” do?',
          'A: Opens your client list to view or edit a client.',
          'Q: What does “Organisation” do?',
          'A: Opens access management for the selected client.',
          'Q: What does “Budget Report” do?',
          'A: Opens the annual budget view for deeper inspection by category.',
          'Q: What does “View Transaction” do?',
          'A: Opens the transaction history (receipts from carers).',
          'Q: What does “Request Form” do?',
          'A: Opens the form to submit changes to care items.',
          'Q: What does my “Avatar” button do?',
          'A: Opens user account actions like “Update details” and “Sign out”.',
          'Q: What does the “Client Avatar” button do?',
          'A: Opens the selected client’s profile page.',
          'Q: Where is the “Print” button?',
          'A: Each major page has a “Print” button near the header to open the system print dialog.',
        ],
      },
    ],
  },

  'family/my-clients': {
    title: 'Family / POA — My Clients',
    sections: [
      {
        id: 'family-my-clients',
        title: 'Add a new client',
        body: [
          'Q: How do I add a new client?',
          'A: Click “Add new client” (top-right), fill out the profile, and save.',
          'Q: What does “Add new client” do?',
          'A: Opens the client profile form to create a new record.',
          'Q: What does “Edit / Open profile” do (per row)?',
          'A: Opens that client’s profile for editing details.',
          'Q: What does “View schedule” do (per row)?',
          'A: Opens the calendar view scoped to that client.',
          'Q: Why do I see “Access code” on the profile?',
          'A: The numeric access code links this client across roles/systems; keep it private.',
        ],
      },
    ],
  },

  'family/client-profile': {
    title: 'Family / POA — Client Profile',
    sections: [
      {
        id: 'family-client-profile',
        title: 'Create or update a profile',
        body: [
          'Q: How do I create or update a client profile?',
          'A: Open “Client Profile”, enter or edit the client’s details, and click “Save”.',
          'Q: How do I link a new person if they don’t have an access code?',
          'A: Click “Create one here” to generate an access code, then save it with the profile.',
          'Q: What does “Save” do?',
          'A: Persists all profile changes for the client.',
          'Q: Can I upload/update the client avatar?',
          'A: Yes. Click the avatar area (if enabled) to upload a new image and then save.',
        ],
      },
      {
        id: 'family-access-code',
        title: 'Create new access code',
        body: [
          'Q: What is an access code?',
          'A: It’s a unique personal token for that client, used to link their data and personal information. Do not share it; anyone with this code can access that client’s information.',
          'Q: How do I create a new access code for a client?',
          'A: Click “Create access code” under the access code field, then click “Generate” to get a new code; copy and paste it into the access code field.',
          'Q: What does the “Generate” button do?',
          'A: Generates a new access code for the client and displays it.',
          'Q: What does the “Copy” button do?',
          'A: Clicking it copies the generated access code to your clipboard.',
          'Q: What should I do after I click “Copy”?',
          'A: Paste the code into the access code field and save the profile along with other details.',
          'Q: How can I paste the copied access code?',
          'A: Right-click and choose “Paste”, or use Ctrl+V (Windows) / Command+V (Mac).',
          'Q: What should I do once I have my client’s access code?',
          'A: Keep it secure and share it only with organisation management or family/POA who need access.',
        ],
      },
    ],
  },

  'family/organisation-access': {
    title: 'Family / POA — Organisation Access',
    sections: [
      {
        id: 'family-organisation-access',
        title: 'Manage organisation access',
        body: [
          'Q: How do I manage organisation access for a specific client?',
          'A: Go to “Organisation”, use “Select a Client” to pick the client, then approve/reject requests or revoke access as needed.',
          'Q: What does “Select a Client” do?',
          'A: Switches which client’s organisation access you’re managing.',
          'Q: What does “Approve” do?',
          'A: Grants the requesting organisation access to the client’s data or schedule.',
          'Q: What does “Reject” do?',
          'A: Denies the request and preserves current access.',
          'Q: What does “Revoke” do?',
          'A: Removes existing organisation access for the selected client.',
          'Q: Where can I see access history?',
          'A: Use the history tab/section to review previous grants and revocations.',
        ],
      },
    ],
  },

  'family/budget-report': {
    title: 'Family / POA — Budget Report',
    sections: [
      {
        id: 'family-budget-report',
        title: 'Annual budget by category',
        body: [
          'Q: How do I view a client’s annual budget and remaining balance?',
          'A: Open “Budget Report”, select a year to see total budget, spent to date, and remaining balance.',
          'Q: How do I drill into a category’s care items?',
          'A: Click the category to view item-level spend.',
          'Q: What does the “Year” selector do?',
          'A: Changes the reporting year and recalculates totals.',
          'Q: What does clicking a “Category” tile/row do?',
          'A: Opens a detailed breakdown for that category and its items.',
          'Q: Where is the “Print” option?',
          'A: Use the “Print” button near the header to print the current report.',
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
          'Q: How do I view and search receipts?',
          'A: Open “View Transaction” to browse all receipts; use search to filter. Status shows pending or adopted by management.',
          'Q: What does the “Search” box/button do?',
          'A: Filters the receipt list by keywords such as vendor or notes.',
          'Q: What does “Open/View receipt” do?',
          'A: Opens the receipt details or file preview.',
          'Q: What does “Download” (if present) do?',
          'A: Saves a copy of the receipt file to your device.',
          'Q: Can I filter by date or client?',
          'A: Yes, use the filter controls (if enabled) at the top of the list.',
        ],
      },
    ],
  },

  'family/request-form': {
    title: 'Family / POA — Request of Change Form',
    sections: [
      {
        id: 'family-request-form',
        title: 'Submit a change request',
        body: [
          'Q: How do I submit a change request for a care item to the management?',
          'A: Open “Request Form”, describe the change, and submit. It is sent to Management automatically.',
          'Q: What does “Submit” do?',
          'A: Sends your change request to Management for review.',
          'Q: What does “Cancel/Close” do?',
          'A: Dismisses the form without sending a request.',
          'Q: How do I track the decision?',
          'A: Check “Request Log” (Management) or the care item’s comments/notifications for status updates.',
        ],
      },
    ],
  },

  /* =========================
   * CARER
   * ========================= */
  'carer/welcome-login': {
    title: 'Carer — Welcome & Login',
    sections: [
      {
        id: 'carer-signup',
        title: 'Sign Up',
        body: [
          'Q: How do I create a Carer account?',
          'A: Click “Sign Up”, choose “Carer”, complete the form, and submit.',
          'Q: What does the “Sign Up” button do?',
          'A: Starts the Carer account creation flow.',
          'Q: What does “Submit/Continue” do?',
          'A: Submits your details and finalizes the account.',
          'Q: I see a browser warning. Can I proceed?',
          'A: For demo/testing, click “Details” → “Visit this unsafe site”. Do not use real personal data.',
        ],
      },
      {
        id: 'carer-role-select',
        title: 'Role selection',
        body: [
          'Q: How do I choose the Carer role at sign-up?',
          'A: On the role screen, select “Carer” before completing registration.',
          'Q: What does selecting “Carer” do?',
          'A: Sets your permissions and menus for carer workflows.',
          'Q: Can carers see all staff schedules?',
          'A: Typically carers see their assigned items; visibility may be limited by the organisation’s policy.',
        ],
      },
    ],
  },

  'carer/dashboard': {
    title: 'Carer — Dashboard',
    sections: [
      {
        id: 'family-dashboard-overview',
        title: 'Choose a view',
        body: [
          'Q: How do I switch between staff and client schedules?',
          'A: On the main dashboard, choose either “Staff Schedule” or “Client Schedule”.',
          'Q: What do the “Staff Schedule” / “Client Schedule” options do?',
          'A: They switch the main calendar view to show staff vs. client items.',
          'Q: What happens if no client is selected?',
          'A: You’ll see “No client selected”. Use “Select a client” to pick one before viewing items.',
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
          'A: It displays care items scheduled in the selected month for the selected (assigned) client.',
          'Q: How do I switch the client I am viewing?',
          'A: Use “Select a client” (or the Assigned client dropdown) to choose another client you are assigned to.',
          'Q: What do the Prev/Next (Left/Right) arrows do?',
          'A: They move the calendar backward/forward by one month.',
          'Q: How do I select a different month directly?',
          'A: Click the calendar icon next to the title to open a month picker.',
          'Q: What does the pink-highlighted number represent?',
          'A: It’s today. Click it to jump to today and list today’s care items.',
          'Q: What does the blue-highlighted number represent?',
          'A: It indicates a day with scheduled care items. Click it to see the items for that day.',
          'Q: What happens when I click a care item on the calendar?',
          'A: The care item details open, showing last done, next due, frequency, status, comments, and files.',
          'Q: How do I mark a care item as completed from the schedule?',
          'A: Open the item from the calendar and click “Mark as completed”; add notes/files if required, then save.',
          'Q: How do I add a work note or clarification?',
          'A: In the item panel, click “Add comment”, type your message, and click “Save”.',
          'Q: How do I upload files as evidence (photos/PDFs)?',
          'A: In the item panel, click “Upload file” to attach images or PDFs and then save.',
          'Q: How do I upload a receipt for a purchase related to this item?',
          'A: Click “Go to transactions” from the item (or open “View Transactions”) and upload the receipt; multiple line items per receipt are supported.',
          'Q: How do I search for a specific care item on the schedule?',
          'A: Use the search bar to filter by item title or keywords.',
          'Q: Can I filter the list by status (e.g., completed/pending)?',
          'A: If the status filter is available on your build, use it to show/hide completed items.',
          'Q: What does “Users with access” do (if visible)?',
          'A: Shows who has access to this client’s schedule (e.g., management/family).',
          'Q: Can I print this schedule?',
          'A: Yes. Click the “Print” button near the header to open the system print dialog.',
          'Q: I can’t see any items — what should I check?',
          'A: Make sure a client is selected, the chosen month actually has scheduled items, and any active filters are cleared.',
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
          'A: Open the client profile to see their picture, name, DOB, and notes. Add your note and click “Save notes”.',
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
        title: 'Update your email & password',
        body: [
          'Q: How do I update my email or password?',
          'A: Click your avatar → “Update details”, make changes, then save.',
          'Q: What does “Save” do?',
          'A: Persists your updated email/password after validation.',
          'Q: What does “Cancel/Close” do?',
          'A: Exits without saving changes.',
          'Q: I forgot my password. What do I do?',
          'A: Use “Forgot password” on the login screen to reset it via email.',
        ],
      },
    ],
  },

  'carer/budget-report': {
    title: 'Carer — Budget Report',
    sections: [
      {
        id: 'carer-budget-report',
        title: 'Annual budget overview',
        body: [
          'Q: How do I view yearly budget and remaining balance?',
          'A: Open “Budget Report” to see total budget, spent to date, and remaining balance.',
          'Q: How do I drill into category or item-level spend?',
          'A: Click a category to see its sub-categories and item-level details.',
          'Q: What does the “Year” selector do?',
          'A: Changes the reporting year for the budget figures.',
          'Q: What does clicking a “Category” tile/row do?',
          'A: Opens a breakdown for that category’s items and spend.',
          'Q: Can I export or print?',
          'A: Use “Print” to print; export (CSV/PDF) is available if enabled by your organisation.',
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
          'A: Open “View Transactions” to see purchases/refunds, who uploaded them, and any linked care items. Use the upload flow to add new transactions and attach receipts.',
          'Q: What does “Upload transaction” / “Add transaction” do?',
          'A: Starts a new transaction entry where you can add line items and totals.',
          'Q: What does “Attach receipt” do?',
          'A: Lets you upload images/PDFs and associate them with the transaction.',
          'Q: What does the “Search” box/button do?',
          'A: Filters the transaction list by keyword.',
          'Q: What does “Open/View receipt” do?',
          'A: Opens the receipt preview or details.',
          'Q: Can I edit or delete a transaction?',
          'A: Yes, if your organisation permits. Use the row actions on the transaction list.',
        ],
      },
    ],
  },

  'carer/add-comment': {
    title: 'Carer — Add a comment',
    sections: [
      {
        id: 'carer-add-comment',
        title: 'Add a comment',
        body: [
          'Q: How do I add a comment to a care item?',
          'A: Open the care item, click “Add comment” at the bottom of the panel, type your update, and click “Save”. Family/POA and Management can view your comment.',
          'Q: What does “Add comment” do?',
          'A: Opens a comment editor for the selected care item.',
          'Q: What does “Save” do?',
          'A: Stores your comment so other roles can see it.',
          'Q: What does “Cancel/Close” do?',
          'A: Closes the comment editor without saving.',
          'Q: Can I edit or delete my comment later?',
          'A: Yes if allowed by policy. Use the item’s comment list actions.',
        ],
      },
    ],
  },

  /* =========================
   * MANAGEMENT
   * ========================= */
  'management/welcome-login': {
    title: 'Management — Welcome & Login',
    sections: [
      {
        id: 'mgmt-login',
        title: 'Sign In & Role',
        body: [
          'Q: How do I sign in as Management?',
          'A: Use your organisation account on the login screen and ensure your role is set to “Management”.',
          'Q: What does selecting “Management” role do?',
          'A: Enables access to organisation-wide tools such as approvals, care item templates, and request logs.',
          'Q: Can I invite additional management users?',
          'A: Yes, if you have admin permissions. Use your organisation’s user management page.',
        ],
      },
    ],
  },

  'management/dashboard': {
    title: 'Management — Dashboard',
    sections: [
      {
        id: 'mgmt-overview',
        title: 'Overview & navigation',
        body: [
          'Q: Where can I review pending items at a glance?',
          'A: Use the dashboard cards for pending access requests, receipts awaiting review, and change requests.',
          'Q: How do I navigate to management tools quickly?',
          'A: Use the top navigation: Care Items, View Transactions, Budget Report, Request Log, Organisation, and more.',
          'Q: Can I filter by organisation site or team?',
          'A: If enabled, use the site/team filter at the top of the dashboard.',
          'Q: Is there a print button?',
          'A: Yes, click “Print” on pages where summaries or lists need to be printed.',
        ],
      },
    ],
  },

  'management/edit-care-items': {
    title: 'Management — Edit Care Items',
    sections: [
      {
        id: 'edit-care-item',
        title: 'Manage care items',
        body: [
          'Q: How do I add or edit a care item template for clients?',
          'A: Go to “Care Items”, create a new template or edit an existing one, then assign it to clients as needed.',
          'Q: What does “Assign to client(s)” do?',
          'A: Applies the configured care item to selected clients’ schedules.',
          'Q: How do I change frequency or due dates?',
          'A: Edit the item’s repeat settings (e.g., weekly/monthly) and save; new occurrences will follow the updated rules.',
          'Q: Can I archive or delete an item?',
          'A: Yes, if permitted. Use the item’s actions menu to archive or delete.',
          'Q: Where can I preview an item’s schedule impact?',
          'A: Use the “Preview” panel (if available) before saving changes.',
        ],
      },
    ],
  },

  'management/add-care-items': {
    title: 'Management — Add Care Items',
    sections: [
      {
        id: 'add-care-item',
        title: 'Create care items',
        body: [
          'Q: How do I add or edit a care item template for clients?',
          'A: Go to “Care Items”, create a new template or edit an existing one, then assign it to clients as needed.',
          'Q: What does “Assign to client(s)” do?',
          'A: Applies the configured care item to selected clients’ schedules.',
          'Q: How do I change frequency or due dates?',
          'A: Edit the item’s repeat settings (e.g., weekly/monthly) and save; new occurrences will follow the updated rules.',
          'Q: Can I import items from CSV or a catalog?',
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
        title: 'Audit & approval',
        body: [
          'Q: How do I review receipts uploaded by carers?',
          'A: Open “View Transactions” to filter by client, date, or status, then open a receipt to inspect details.',
          'Q: What do “Approve / Reject” actions do?',
          'A: “Approve” confirms the expense; “Reject” sends it back for correction with your notes.',
          'Q: How do I export transactions?',
          'A: Use the export/download controls (if enabled) to get a CSV or PDF for auditing.',
          'Q: Can I bulk-approve?',
          'A: If enabled, select multiple records and choose a bulk action from the toolbar.',
        ],
      },
    ],
  },

  'management/budget-report': {
    title: 'Management — Budget Report',
    sections: [
      {
        id: 'mgmt-budget',
        title: 'Budget monitoring',
        body: [
          'Q: How do I monitor budget utilisation across clients?',
          'A: Open “Budget Report”, pick a year, and review totals, spent to date, and remaining balances per client or category.',
          'Q: How do I drill into overspend risks?',
          'A: Click a category/client row to view item-level spend and trends.',
          'Q: Can I export or print?',
          'A: Yes. Use the export (if available) or “Print” to retain a copy for auditing.',
        ],
      },
    ],
  },

  'management/request-log': {
    title: 'Management — Request Log',
    sections: [
      {
        id: 'mgmt-request-log',
        title: 'Change requests',
        body: [
          'Q: How do I review change requests from Family/POA?',
          'A: Open “Request Log”, select a request to read details, and choose Approve or Reject with comments.',
          'Q: What happens after I approve or reject?',
          'A: The requester is notified, and the system updates the related care item if applicable.',
          'Q: Can I filter by status or requester?',
          'A: Yes. Use the filter controls at the top of the request list.',
        ],
      },
    ],
  },

  'management/organisation-access': {
    title: 'Management — Organisation Access',
    sections: [
      {
        id: 'mgmt-org-access',
        title: 'Access requests & revocations',
        body: [
          'Q: How do I approve or revoke an organisation’s access to a client?',
          'A: Go to “Organisation”, open the relevant client, then approve incoming requests or revoke existing access.',
          'Q: Can I see access history?',
          'A: Yes. Use the history view to audit previous grants and revocations.',
          'Q: Can I restrict staff to specific clients?',
          'A: Yes. Adjust role-based access or team assignments in your organisation settings.',
        ],
      },
    ],
  },

  'management/client-profile': {
    title: 'Management — Client Profile',
    sections: [
      {
        id: 'mgmt-client-profile',
        title: 'Review & edit client details',
        body: [
          'Q: How do I update a client’s profile on behalf of the organisation?',
          'A: Open the client profile, edit the necessary fields, and click “Save”.',
          'Q: How do I regenerate an access code if needed?',
          'A: Use “Generate Access Code”; remember this numeric code is the client’s personal token—do not share it publicly.',
          'Q: Can I deactivate a client?',
          'A: Yes, if allowed. Use the “Deactivate” action to hide from active lists without deleting history.',
        ],
      },
    ],
  },
};
