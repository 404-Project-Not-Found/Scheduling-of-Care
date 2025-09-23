<!-- I'm using template i found in github in the following link: https://github.com/othneildrew/Best-README-Template/edit/main/README.md -->

<div align="center">
    <a href="https://github.com/404-Project-Not-Found/Schedule-of-Care-Program">
        <img src="images/Logos.png" alt="Logo" width="80" height="80">
    </a>
    <h1 align="center">Schedule of Care</h1>
    <p align="left">
        Schedule of Care is a tool to assist the people who care and manage the care of people with special needs. It places responsibilities, updates and schedule into one application, making it easier to ensure tasks are documented and responsive to change.
    </p>
</div>


<!-- TABLE OF CONTENTS -->
<details>
    <summary>Table of Contents</summary>
    <ol>
        <li>
            <a href="#about-the-project">About the Project</a>
            <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#tech-stack-and-resources">Tech Stack and Resources</a></li>
            </ul>
        </li>
        <li>
            <a href=#get-started>Getting Started</a>
            <ul>
                <li><a href="prerequisites">Prerequisites</a></li>
                <li><a href="installation">Installation</a></li>
            </ul>
        </li>
        <li><a href="#deployment">Deployment</a></li>
        <li><a href="#license">License</a></li>
        <li><a href="#members">Team Members</a></li>
        <li><a href="#links">Links</a></li>
    </ol>
</details>
</br>

<!-- ABOUT THE PROJECT -->
# About the Project

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
    <li><strong>Backend</strong>: <a href="https://www.typescriptlang.org/docs/">Typescript</a>, <a href="https://www.mongodb.com/">Mongodb</a>, <a href="https://next-auth.js.org/getting-started/introduction">Auth.js(NextAuth)</a></li>
    <li><strong>Testing</strong>: to be added</li>
    <li><strong>CI</strong>:<a href="https://docs.github.com/en/actions/get-started/understand-github-actions">Github actions</a></li>
    <li><strong>Deployment</strong>: <a href="https://vercel.com/resources">Vercel</a></li>
</ul>
</br>

# Getting Started
### Prerequisites
Before running the app, ensure that you have the following:
<ul>
    <li>Node.js</li>
    <li>Package manager - pnpm or npm or yarn</li>
    <li><a href="https://www.mongodb.com/cloud/atlas/register">MongoDB Atlas account</a>(or local MongoDB)</li>
    <li>Vercel Account(If going to deploy, no installation required locally but need to create account)</li>
</ul>

### Installation
If local development do the following:
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
    <li>Set up environment variables</li>
    create a <code>.env.local</code> file in the root with the following as example:
    <pre><code>MONGODB_URI="your-mongodb-connection"</code></pre>
    <li>Run the development server</li>
    <pre><code>pnpm dev
#or
npm run dev
#or
yarn dev</code></pre>
</ol>
Open <a href="http://localhost:3000">http://localhost:3000</a> on your browser to view the result
</br>

# Deployment
Once deployment, do the following:
<ol>
    <li>Push code to GitHub</li>
    <li>Connect the repo to Vercel</li>
    <li>Add the <code>MONGODB_URI</code> to environment variables in Vercel</li>
    <li>Vercel will then auto-build and deploys each push to the default branch</li>
</ol>

</br>

# License

</br>

# Team Members

</br>

# Links
To be added






# COMP30022-IT-Project-Schedule-of-Care-Program
Project for COMP30022 IT Project 2025 

Link to project: Add web app link here 


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
