# Rate My Everything

Web-based application focused on rating different objects/interests based of multiple reviews from each user, focused more into individual rating rather than a collective one.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

[![Project's CI](https://github.com/cristiadu/rate-my-everything/actions/workflows/node.js.yml/badge.svg)](https://github.com/cristiadu/rate-my-everything/actions/workflows/ci.yml)
[![CodeQL](https://github.com/cristiadu/rate-my-everything/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/cristiadu/rate-my-everything/actions/workflows/codeql-analysis.yml)

## Development Progress
See [Issues](https://github.com/cristiadu/rate-my-everything/issues) for a more detailed list of tasks.

## Available Scripts

In the project directory, you can run:

### `npm install`
Will install all needed dependencies on `node_modules`.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run build-storybook`

Builds the storybook with the catalog of React Components used by the application.

### `npm run storybook`

Serve the storybook component catalog.
Open [http://localhost:6006](http://localhost:6006) to view it in the browser.

### `npm run format-code` and `npm run check-code`

Applies ESLint on code in `src` folder.

The difference is that `format-code` will reformat the code automatically based on the linter rules, while `check-code` will just report the problems.

## Required Environment Variables

- `JWT_SECRET`: The secret key used to sign and verify JWT tokens. Example: `my-dev-secret` (choose your own secret for development)

## How to run the API locally

You must set the `JWT_SECRET` environment variable when starting the API server. For example:

```
JWT_SECRET=my-dev-secret npm start
```

Or, if you use Windows:

```
set JWT_SECRET=my-dev-secret && npm start
```

If you use a process manager or VS Code launch configuration, set `JWT_SECRET` in your environment accordingly.
