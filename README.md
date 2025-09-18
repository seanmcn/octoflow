# GitHub Issues Gantt Chart

A pure browser app that authenticates with GitHub, fetches issues from a private repo, derives start/end dates from workflow history, renders a Gantt chart, and lists unstarted issues.

## Setup

### 1. Configure GitHub OAuth App

To use this application, you need to register your own GitHub OAuth App and use its Client ID.

1.  Go to your GitHub **Settings**.
2.  Navigate to **Developer settings** > **OAuth Apps**.
3.  Click **New OAuth App**.
4.  Fill in the application details:
    *   **Application name**: Anything you like, e.g., "Gantt Chart Generator".
    *   **Homepage URL**: The URL where you will deploy the app. If using GitHub Pages, this will be `https://<your-username>.github.io/<your-repo-name>/`. You can also use `http://localhost:5173` for local development.
    *   **Authorization callback URL**: This must match the URL where the app is running. For local development with Vite's default port, use `http://localhost:5173/`. For GitHub Pages, use the same URL as your homepage: `https://<your-username>.github.io/<your-repo-name>/`. You can add multiple callback URLs.
5.  Click **Register application**.
6.  On the next page, you will see your **Client ID**. Copy this value.
7.  Open the `src/auth.ts` file in this project and replace the placeholder value of `GITHUB_CLIENT_ID` with your actual Client ID.

### 2. Install and Run

1. Clone the repository.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
   - The app will be available at `http://localhost:5173`.

## Deployment to GitHub Pages

1.  Update `vite.config.ts` and set the `base` property to your repository name. For example, if your repository is `https://github.com/your-username/your-repo-name`, the `base` should be `/your-repo-name/`.
2.  Build the project: `npm run build`. This will create a `dist` directory.
3.  Commit the `dist` directory to a `gh-pages` branch.
4.  Push the `gh-pages` branch to GitHub.
5.  Enable GitHub Pages for your repository and select the `gh-pages` branch as the source.

The app will be available at `https://your-username.github.io/your-repo-name/`.
