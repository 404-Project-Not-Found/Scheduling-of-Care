<!-- I'm using template i found in github in the following link: https://github.com/othneildrew/Best-README-Template/edit/main/README.md -->

<div align="center">
    <a href="https://github.com/404-Project-Not-Found/Schedule-of-Care-Program">
        <img src="images/logo-name.png" alt="Logo" width="147.6" height="65.4">
    </a>
    <h1 align="center">Scheduling of Care</h1>
    <p align="left">
        Scheduling of Care is a tool to assist the people who care and manage the care of people with special needs. It places responsibilities, updates and schedule into one application, making it easier to ensure tasks are documented and responsive to change.
    </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
    <summary><Strong>Table of Contents</strong></summary>
    <ol>
        <li>
            <a href="#about-the-project">About the Project</a>
            <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#tech-stack-and-resources">Tech Stack and Resources</a></li>
            </ul>
        </li>
        <li>
            <a href=#getting-started>Getting Started</a>
            <ul>
                <li><a href="#prerequisites">Prerequisites</a></li>
                <li><a href="#installation">Installation</a></li>
                <li><a href="#mongodb-setup-guide">Mongodb Setup Guide</a></li>
            </ul>
        </li>
        <li><a href="#deployment">Deployment</a></li>
        <li><a href=#testing>Testing</a></li>
        <li><a href="#team-members">Team Members</a></li>
        <li><a href="#license">License</a></li>
        <li><a href="#links">Links</a></li>
    </ol>
</details>

<!-- Content -->

## About the Project

### Features

<details>
    <summary>Roles and Permissions for User</summary>
    <ul>
        <li>Four different users(Management/Carer/Family Member/Power of Attorney) where each users have different permissions on what they can view and edit</li>
        <li>Family Member  has highest authority, followed by Power of Attorney(POA) who fulfils the role of Family Member in situation where person of special needs/client has no family members.</li>
        <li>Family Member gives access to Management, organisations that cares for person with special needs. Management can give access to Carer, individual who takes care of the client's</li>
        <li>Family/POA can revoke Management's access and Management can revoke Carer's access, they will lose access to client's data after.</li>
    </ul>
</details>
<details>
    <summary>Sign up and Log in</summary>
    <ul>
        <li>During Sign up, each user will need to select their role between Carer/Management/Family or POA and fill in their information. For Carer and Management they will need to use their work email from the organisation</li>
        <li>Family/POA will need to approve access to allow Management to access the client's information. Management has to complete registration for the client</li>
        <li>Management will need to give access for Carer so they can view information on client</li>
        <li>Users would only need to input their email and password to log in</li>
    </ul>
</details>
<details>
    <summary>Tasks and Calendar</summary>
    <ul>
        <li>Management can add/edit/remove tasks for client, choose the frequency, its status, and category</li>
        <li>Family/POA can request for tasks to be revised or removed</li>
        <li>For repeated task, the application will automatically repeat task reminder in calendar based on information inputted by Management</li>
        <li>Carer can view task, mark task as done, add comments related to task and upload file as evidence that task has been completed</li>
        <li>Management would need to validate task based on evidence upload to verify whether task has been completed</li>
    </ul>
</details>
<details>
    <summary>Budgeting and Finance</summary>
    <ul>    
        <li>Set budget for the year, budget then can be split into categories by management. Can only be edited by Management but Family can make requests</li>
        <li>When a task that requires finance is completed, management would deduct from the budget based on how much is spent</li>
        <li>Application will record receipts for task/care items which Carer has uploaded</li>
        <li>When only a certain amount is left for a category, notification will be sent as warning</li>
    </ul>
</details>

### Tech Stack and Resources

<ul>
    <li><strong>Framework</strong>: <a href="https://nextjs.org/docs">Next.Js</a></li>
    <li><strong>Frontend</strong>: <a href="https://react.dev/learn">React</a></li>
    <li><strong>Backend</strong>: <a href="https://www.typescriptlang.org/docs/">Typescript</a>, <a href="https://www.mongodb.com/">Mongodb</a>, <a href="https://next-auth.js.org/getting-started/introduction">Auth.js(NextAuth)</a>, <a href="https://resend.com/">Resend</a></li>
    <li><strong>Testing</strong>: to be added</li>
    <li><strong>CI</strong>:<a href="https://docs.github.com/en/actions/get-started/understand-github-actions"> Github actions</a></li>
    <li><strong>Deployment</strong>: <a href="https://vercel.com/resources">Vercel</a></li>
</ul>

## Getting Started

### Prerequisites

Before running the app, ensure that you have the following:

<ul>
    <li>Node.js</li>
    <li>Package manager - pnpm or npm or yarn</li>
    <li><a href="https://www.mongodb.com/cloud/atlas/register">MongoDB Atlas account</a>(or local MongoDB)</li>
    <li><a href="https://vercel.com/signup">Vercel Account</a>(If going to deploy, no installation required locally but need to create account)</li>
     <li><a href="https://resend.com/signup">Resend account</a>(required for testing and custom domain verification is also needed for production).</li>
</ul>

### MongoDB Setup Guide
<ol>
    <li>Create an account:
        <ol type="a">
            <li> Go to <a href="https://www.mongodb.com/cloud/atlas/register">MongoDB Atlas account</a>to create an account and sign up</li>
        </ol>
    </li>
    <li>Create a cluster
        <ol type="a">
            <li> Choose the free options or if you wish to add more storage, choose the payment option</li>
            <li> Pick the nearest region to where you are.</li>
            <li> Create a cluster — for team projects, you can share a cluster but use separate databases for each environment or developer.</li>
        </ol>
    </li>
    <li>Configure Access
        <ol type="a">
            <li>Add database user (username and password).</li>
            <li> Add IP address or set to 0.0.0.0/0 (<b>Not ideal for production</b>, use only for testing).</li>
        </ol>
    </li>
    <li>Get Connection String
        <ol type="a">
            <li> Click connect → choose driver and Node.js from dropdown → Use password and username from when you create your database.</li>
            <li> Get the URI and place this in .env.local in your environment as the following:</li>
            <pre><code>MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority"</code></pre>
            <li> Add this your <code>.env.local</code> file</li>
        </ol>
    </li>
    <li>Set up mongodb.ts
        <ol type="a">
            <li> Example setup connecting via Mongoose:</li>
            <pre><code>import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) throw new Error("Please add uri into .env.local");

declare global {
  var _mongooseConnection: { isConnected?: boolean } | undefined;
}

export const connectDB = async () => {
  if (global._mongooseConnection?.isConnected) return mongoose.connection;

  try {
    await mongoose.connect(MONGODB_URI);
    global._mongooseConnection = { isConnected: true };
    console.log("MongoDB is connected via Mongoose");
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};
</code></pre>

        </ol>
    </li>
</ol>

### Set up NextAuth
<ol>
    <li>Generate a secret key, in your terminal run the following command</li>
    <pre><code>openssl rand -base64 32</code></pre>
    <p>it will output your <code>AUTH_SECRET</code></p>
    <pre><code>[your_auth_secret]</code></pre>
</ol>


### Installation
<ol>
    <li>Clone this repository</li>
    <pre><code>git clone https://github.com/404-Project-Not-Found/Schedule-of-Care-Program.git
cd Schedule-of-Care-Program</code></pre>
    <li>Install dependencies</li>
    <pre><code>pnpm install
# or
npm install
#or
yarn install</code></pre>
    <li>Set up environment variables
     <ol type="a">
            <li> In your project root, create a <code>.env.local</code> file</li>
            <li>Add your MongoDB URI, Auth_Secret, the local production URL, Resend API key and base URL</li>
            <pre><code>MONGODB_URI=[your-mongodb-connection-string]
AUTH_SECRET=[your_auth_secret]
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=[your-resend-api-key]
NEXT_PUBLIC_APP_URI=http://localhost:3000</code></pre>
            <li>Run the development server</li>
            <pre><code>pnpm dev
#or
npm run dev
#or
yarn dev
            </code></pre>
        </ol>
    </li>


</ol>
Then open <a href="http://localhost:3000">http://localhost:3000</a> on your browser to view the app

</br>

## Deployment

For deployment, do the following:

<ol>
    <li>Push code to GitHub</li>
    <li>Connect the repo to Vercel</li>
    <li>Add the environment variables in Vercel under Project Settings → Environment Variables:</li>
    <pre><code>MONGODB_URI=[your-mongodb-connection-string]
AUTH_SECRET=[your-auth-secret>]
NEXTAUTH_URL=[your-production-url]
RESEND_API_KEY=[your-resend-api-key]
NEXT_PUBLIC_APP_URI=[your-production-url]   
    </code></pre> 
    <li>Vercel will then auto-build and deploys each push to the default branch</li>
</ol>
For more information, you can read the <a href="https://nextjs.org/docs/app/getting-started/deploying">Next.js Deployment Documentation</a>

</br>

## Testing
To run our unit testing, run the following:
 <pre><code># run all test
npm run test
# run a specific test
npx jest tests/models/Users.test.ts<code></pre>

Test Coverage:
<ul>
  <li><code>/tests/models/Budget.test.ts</code></li>
  <li><code>/tests/models/CareItem.test.ts</code></li>
  <li><code>/tests/models/Category.test.ts</code></li>
  <li><code>/tests/models/Client.test.ts</code></li>
  <li><code>/tests/models/FamilyRequest.test.ts</code></li>
  <li><code>/tests/models/Occurrence.test.ts</code></li>
  <li><code>/tests/models/Organisation.test.ts</code></li>
  <li><code>/tests/models/PasswordResetToken.test.ts</code></li>
  <li><code>/tests/models/Shift.test.ts</code></li>
  <li><code>/tests/models/Transaction.test.ts</code></li>
  <li><code>/tests/models/User.test.ts</code></li>
</ul>



## Team Members

<a href="https://github.com/dpalexander21">
<img style="border-radius: 50%;" src="https://avatars.githubusercontent.com/u/201690137?v=4" width="50px">
</a>
<a href="https://github.com/seekz39">
<img style="border-radius: 50%;" src="https://avatars.githubusercontent.com/u/224220903?v=4" width="50px">
</a>
<a href="https://github.com/vanessateoooooo">
<img style="border-radius: 50%;" src="https://avatars.githubusercontent.com/u/202028025?v=4" width="50px">
</a>
<a href="https://github.com/devniwij">
<img style="border-radius: 50%;" src="https://avatars.githubusercontent.com/u/201507161?v=4" width="50px">
</a>
<a href="https://github.com/zriz15">
<img style="border-radius: 50%;" src="https://avatars.githubusercontent.com/u/136954712?v=4" width="50px">
</a>

</br>
## License

Scheduling for Care is licensed under the MIT license. See <a href="LICENSE">LICENSE</a> for details.
</br>

## Links

<ul>
    <li><a href="">Website</a></li>
    <li><a href="https://team404projectnotfound.atlassian.net/wiki/spaces/09ace67881cc434bab85e12ce5e340a7/overview">Documentation: Confluence</a> -- Requires permission to view</li>
    <li><a href="https://github.com/404-Project-Not-Found/Schedule-of-Care-Program">Source Code</a></li>
    <li><a href="https://team404projectnotfound.atlassian.net/wiki/spaces/09ace67881cc434bab85e12ce5e340a7/pages/100106349/Handover+Documents?atlOrigin=eyJpIjoiZjAzMDBmM2EwODAwNDAyOGJlNzExMmE4Y2FiNTQ4NjMiLCJwIjoiYyJ9 ">Handover Document</a></li>
</ul>

</br>

# Frontend Demo (Mock Mode)

> Quick guide for **local frontend demo** using mock data & mock login. Includes three demo accounts, `.env.local` setup, where to put the mock API, and common gotchas.

---

## 👤 Demo Accounts (Mock Login)

On the login page `/`, use any set below. After login, role is stored in browser storage and controls routing & permissions.

| Role       | Email                  | Password     |
| ---------- | ---------------------- | ------------ |
| Family     | `family@email.com`     | `family`     |
| Carer      | `carer@email.com`      | `carer`      |
| Management | `management@email.com` | `management` |

\* Redirects are based on the current mock logic. If you change your routes, also update the logic in the login page.

---

## ⚙️ Enable Mock Mode

Create **`.env.local`** in the project root:

```ini
NEXT_PUBLIC_ENABLE_MOCK=1
```

What this does:

- Sets the app to **frontend-only mock** mode: login & data are handled on the client, no backend required.
- Tasks are stored in `localStorage["tasks"]`; a demo seed is written on first run.
- Viewer role is stored in:
  - `sessionStorage["mockRole"]` (per-tab, preferred in mock)
  - `localStorage["activeRole"]` (persistent fallback)

---

## ▶️ Run Locally

```bash
# install dependencies
npm install

# start dev server
npm run dev

# open
http://localhost:3000
```

---

## 🧰 Where Is the Mock API?

```
Source files in /src/lib/mock/mockApi.ts which include more details
```

pages import from `@/lib/mock/mockApi`.

---
