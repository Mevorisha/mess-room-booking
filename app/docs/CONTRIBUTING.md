# Contribution Guidelines

This guideline is complementary to the code and therefore references the codebase. You'll have to be able to read code to understand the guidelines.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Environment setup](#environment-setup)
    - [Setting up Node.js & npm](#setting-up-nodejs--npm)
    - [Setting up Firebase CLI](#setting-up-firebase-cli)
    - [Setting up NPM Dependencies](#setting-up-npm-dependencies)
    - [Setting up Environment Variables](#setting-up-environment-variables)
- [Coding Standards](#coding-standards)
  - [Directory Structure](#directory-structure)
  - [CSS Styling Standards](#css-styling-standards)
  - [CSS Global Variables](#css-global-variables)
  - [Animations](#animations)
  - [JS Standards](#js-standards)
  - [React Standards](#react-standards)
  - [A Word on `useCallback`](#a-word-on-usecallback)
  - [When to not `useState`](#when-to-not-usestate)
  - [Forms v/s State & `onChange`](#forms-vs-state--onchange)
  - [Properly using `navigate`](#properly-using-navigate)
  - [Search Parameters](#search-parameters)
  - [Firebase Wrapper Usage](#firebase-wrapper-usage)
- [Linting and Beautification](#linting-and-beautification)

## Introduction

This document provides guidelines for contributing to the project. Please take a moment to review this document in order to make the contribution process easy and effective for everyone involved.

This document contains information about:

- Environment setup
- Coding standards

## Getting Started

### Environment setup

Once you have a local copy of the project, you need to set up your environment. The project has the following dependencies:

- Node.js & npm
- Firebase CLI
- Create React App
- .env.local file

### Setting up Node.js & npm

1. Download and install Node.js from the [official website](https://nodejs.org/).
2. Verify that Node.js and npm are installed by running the following commands in your terminal:

   ```bash
   node -v
   npm -v
   ```

   The above commands should return the versions of Node.js and npm installed on your system.

   It is recommended to use the latest LTS version of Node.js.

### Setting up Firebase CLI

1. Install the Firebase CLI by running the following command in your terminal:
   ```bash
   npm install -g firebase-tools
   ```
2. Verify that the Firebase CLI is installed by running the following command in your terminal:
   ```bash
    firebase --version
   ```
   The above command should return the version of the Firebase CLI installed on your system.

### Setting up NPM Dependencies

1. Navigate to the project directory and run the following command in your terminal:
   ```bash
   npm install
   ```
   This command installs all the dependencies listed in the `package.json` file.
   This will take some time to complete.

### Setting up Environment Variables

The `.env.local` file contains the following environment variables:

- `FIREBASE_APPCHECK_DEBUG_TOKEN`: Firebase App Check debug token. This token is used to bypass the App Check protection during local development.
  Without this token, your Firebase requests will be throttled or blocked by Firebase App Check. To get the debug token, follow the steps mentioned in the [Firebase documentation](https://firebase.google.com/docs/app-check/web/debug-provider).

DO NOT make any changes to the `.env` file. It is only a demo. Commits to this file MAY LEAK api keys and other sensitive information.

Also, DO NOT commit the `.env.local` file to the repository. This file should be left added to the `.gitignore` file to prevent it from being committed.

## Coding Standards

### Directory Structure

The project follows the following directory structure:

```
root
├── .github
│   └── workflows
├── docs/
├── firebase/
│   ├── database.rules.json    -- Firebase Realtime Database rules
│   ├── firestore.indexes.json -- Firestore indexes
│   ├── firestore.rules        -- Firestore rules
│   └── storage.rules          -- Firebase Storage rules
├── public/
├── src/
│   ├── assets/                -- Static assets
│   │   └── images/
│   ├── components/            -- Reusable components
│   ├── contexts/              -- React Global Contexts
│   │   ├── account.js         -- Account related functions
│   │   ├── auth.js            -- User auth state
│   │   ├── dialogbox.js       -- Pop-up dialog box / modal
│   │   ├── identity.js        -- Identity document management
│   │   ├── notification.js    -- In-app pop-up notifications
│   │   ├── profile.js         -- Profile management functions
│   │   ├── user.js            -- Auth user details
│   │   └── ...
│   ├── globals/               -- (Misnomer) Mostly global styles
│   ├── hooks/
│   ├── modules/
│   │   ├── errors/            -- Error cleaning & reporting
│   │   ├── firebase/          -- Firebase services
│   │   │   ├── auth.js        -- Firebase Auth service
│   │   │   ├── db.js          -- Firebase Realtime Database service
│   │   │   ├── init.js        -- Firebase initialization
│   │   │   ├── storage.js     -- Firebase Storage service
│   │   │   └── util.js        -- Related utility functions
│   │   └── util/              -- Non-firebase utility
│   ├── pages/                 -- Page components
│   │   ├── App/
│   │   │   ├── index.jsx      -- Main App component
│   │   │   └── styles.css     -- App component styles
│   │   ├── parameterized/     -- Pages whose content depends on URL params
│   │   │   ├── Profile/       -- User profile page
│   │   │   ├── Onboarding/    -- User onboarding
│   │   │   └── ...
│   │   └── unparameterized    -- Pages whose content depends only on auth user
│   │       ├── Auth/          -- Auth page
│   │       ├── Home/          -- Home page
│   │       └── ...
│   └── index.js
├── .env                       -- Environment variable demo
├── .env.local                 -- Environment variables (.gitignored)
├── .firebaserc
├── .gitignore
├── firebase.json
├── package-lock.json
├── package.json
└── README.md
```

Directory structure is subject to change. The above is a general guideline.

#### Notes:

- All componentss and pages (i.e. React components) should be a directory with an `index.js` file and a `styles.css` file. May include other files as needed.
- The `globals` directory is a misnomer. It contains mostly global styles. My need refactoring.

### CSS Styling Standards

Does not use CSS-in-JS, TailwindCSS or CSS modules. Instead, uses plain CSS with a modified BEM naming convention. Observes the following rules:

#### JSX

```jsx
function InnerComponent() {
  return <div className="some-component">...</div>;
}

export function MyPage() {
  return (
    <div className="pages-MyPage">
      <h1 className="a-title">My Page</h1>
      <p className="a-paragraph">This is a paragraph.</p>
      <InnerComponent />
    </div>
  );
}
```

#### Corresponding CSS

```css
.pages-MyPage {
    /* Page styles */
}

.pages-MyPage .a-title {
    /* Title styles */
}

.pages-MyPage .a-paragraph {
    /* Paragraph styles */
}

.pages-MyPage .some-component {
    /* Component styles */
}

.pages-MyPage .some-component .some-child {
    /* Child component styles */
    /* You can also do some_child if you prefer */
    /* You cannot do SomeChild - this is reserved for React components */
    /* You may do someChild - but this looks ugly */
}

.pages-MyPage .some-component .some-child-modifier {
    /* Child component modifier styles */
}

.pages-MyPage .some-component .some-child-modifier:hover {
    /* Child component modifier hover styles */
}

...
```

This format ensures styles of a component remains within the component and allows class name reuse across components.

**Note**: Try to use class names rather than tags or ids for styling. Additionally use descriptive class names to make it easier to understand the purpose of the specific element.

Finally, import the CSS file in the corresponding component file.

```jsx
import "./styles.css";
```

Global styles are imported in `App/index.jsx` and need not be imported in other components.

### CSS Global Variables

A large number of global variables are defined in `globals/*.css`. These variables are used for colors, fonts, spacing, etc.

Most of these are variables rather than classes and can be used in any component. Importing is not necessary as they are imported in `App/index.jsx`.

Just make sure you haven't made a typo or you'll be tearing your hair out trying to figure out why your styles aren't working.

```css
.pages-MyPage .button {
  background-color: var(--color-primary);
}
```

Some of the names are misleading. For example, `--color-primary` is not a primary color but is the accent color. So using this one for a button is okay but using it for a page background is horrifying.

### Animations

Animations are to be achieved in 3 ways:

- Use CSS classes with `transition` properties for simple animations.
- Use CSS classes with `@keyframes` for more complex animations.
- Use JS to properly time the setting and removal of various animation classes.

For an example, see the `Notification` component at [`components/Notification`](../src/components/Notification).

### JS Standards

- Use ES6 syntax. This includes arrow functions, destructuring, etc.
- Use `const` and `let` instead of `var`.
- Use `async` and `await` for asynchronous operations.
- Use `fetch` for API requests. Do not use `axios`.
- Use `Promise` for asynchronous operations. Do not use callbacks.

Well, those are the basics. Here comes the fun part.

- Use VSCode. This project is easier to work with in VSCode. This includes JSDOC support, and if added later, ESLint support.
- Use JSDOC. Make sure every function has a JSDOC comment. This ensures that VSCode can provide you with in-line error checking and documentation. I'll personally come to your house and haunt your dreams if you don't use JSDOC. For e.g.

  ```js
  /**
   * This is a function that does something.
   * @param {string} param1
   * @param {number} param2
   * @returns {string} The result.
   * @throws {Error} Any error that may occur and what they mean.
   */
  function myFunction(param1, param2) {
    return param1 + param2;
  }
  ```

  Regarding JSDOC, sometimes a value may be an empty array but JSDOC may recognize it as `never[]`. In such cases, use `@type {Array<type>}` or `@type {type[]}` to specify the type of the array.

  This is typecasting in JSDOC and can be sparingly used to fix type errors. For e.g.

  ```js
  /** @type {string[]} */ ([]);
  ```

  **Note**: Don't forget to add the `()` when casting using `@type` JSDOC. If you miss it, the cast will not work.

- Other than callbacks, all functions should be named functions (as long as it doesn't cause issues with `this`).
- In `async` functions, use `return Promise.reject` instead of throw.
- Try to chain promises rather than nesting them. For e.g.

  ```js
  auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => setUser(userCredential.user))
    .then(() => navigate(PageUrls.HOME))
    .then(() => notify("Logged in successfully", "success"))
    .catch((error) => notify(error.message, "error"));
  ```

  You'll notice the notify on catch format in many places.This is to ensure that the user is notified of any errors that occur.

### React Standards

- Use functional components with hooks. Class components are not allowed. I'll personally come to your house and haunt your dreams if you commit a class component. Why? Because there's a new way to do things.
- Redux isn't used. Instead, use React Contexts for global state management.
- Use `react-router-dom` for routing. Use `useNavigate` to navigate programmatically. Use `useSearchParams` to get URL parameters. Use `useLocation` to get the current location and fetch origin name.
- Do not put a lot of side effects in a single `useEffect`. Instead, create seperate `useEffect`s for unrelated side effects. This is to avoid convolution of logic when taking actions due to state update.
- Certain contexts are provided in the [`contexts`](../src/contexts) directory. These are:
  - [`account.js`](../src/contexts/account.js): Provides user account state (to be accessed via [`hooks/compositeUser.js`](../src/hooks/compositeUser.js)).
  - [`auth.js`](../src/contexts/auth.js): Provides user authentication state (to be accessed via [`hooks/compositeUser.js`](../src/hooks/compositeUser.js)).
  - [`dialogbox.js`](../src/contexts/dialogbox.js): Provides dialog box state (to be accessed via [`hooks/dialogbox.js`](../src/hooks/dialogbox.js)).
  - [`notification.js`](../src/contexts/notification.js): Provides in-app notifications (to be accessed via [`hooks/notification.js`](../src/hooks/notification.js)).
  - And a few more...
- If there exists a hook to wrap over a context, use the hook rather than the context directly. The hook may have some optimization or additional logic. For e.g., `useNotification` simplifies `NotificationContext` into a single function call rather than four seperate calls.
- If there exists an object with constant definitions (enums), use it rather than using literals directly in code. Some existing constants are given in:
  - [`modules/util/pageUrls.js:PageUrls`](../src/modules/util/pageUrls.js): Paths to various pages as used in router.
  - [`modules/util/pageUrls.js:ActionParams`](../src/modules/util/pageUrls.js): URL params as used in navigation for special actions.
  - [`modules/errors/ErrorMessages.js:ErrorMessages`](../src/modules/errors/ErrorMessages.js): Generic error messages; Use only if no good error message can be provided.
  - [`contexts/auth.js:AuthStateEnum`](../src/contexts/auth.js): Various auth states, see [How to use Composite User Context](#how-to-use-composite-user-context).
- States that are strings often get initialised to `""`. However, if you cannot use an empty string, you can set it to `"EMPTY"`. A function `isEmpty` is provided to check if a value is empty. See [`modules/util/validations.js`](../src/modules/util/validations.js).
- Custom defined react components should nnot return `null`. In case nothing is to be rendered, return `<></>`. To enforce this, add a JSDOC `@returns {React.JSX.Element}` to the functional component.

#### How to use Notification Context

```jsx
import useNotification from "@/hooks/notification.js";
...
const notify = useNotification();
notify("This is a notification", "success");
```

The status can be `success`, `error`, `warning` or `info`. The respective colors are `Green`, `Red`, `Yellow` and `Teal`.

#### How to use Composite User Context

```jsx
import useCompositeUser from "@/hooks/compositeUser.js";
...
const compUsr = useCompositeUser();
```

The composite user context provides the following properties:

- `authCtx.state`: is an enum that can be `"STILL_LOADING"`, `"LOGGED_IN"` or `"NOT_LOGGED_IN"`.
- `userCtx.user`: See the `User` class in [`contexts/user.js`](../src/contexts/user.js).
- Other functions to update the user state both localy and on Firebase. See [`hooks/compositeUser.js`](../src/hooks/compositeUser.js).

### A Word on `useCallback`

`useCallback` is a React hook that is used to prevent re-creation of functions on every render. This is useful when passing functions as props to child components or when such functions are used in `useEffect` dependencies.

Do not use `useCallback` unnecessarily. While using it may not cause noticeable performance issues, it can make the code harder to read and introduce bugs if incorrect dependencies are passed to the `useCallback` hook.

**Note**: You should pass states to functions if you're using `useCallback` and haven't used the state as a dependency. For e.g.

```jsx
const [state, setState] = useState("someValue");

const handleClick = useCallback((stateValue) => {
  // Do something with stateValue
}, []);

return (
  {/* Pass state to handleClick */}
  <button onClick={() => handleClick(state)}>Click me</button>
);
```

### When to not `useState` - Refactoring Side Effects

`useState` is a React hook that is used to manage state in functional components. However, it is not always necessary to use `useState` for every piece of state in a component.

For example, if you're calling `setState` due to some user action, you may `useEffect` to listen for changes to the state and perform some action. For e.g.

```jsx
useEffect(() => {
  if (state === "someValue") {
    // Do something
  }
}, [state]);

return <button onClick={() => setState("someValue")}>Click me</button>;
```

You can refactor this to:

```jsx
function handleClick() {
  // Do something
}

return <button onClick={handleClick}>Click me</button>;
```

In other words, don't `useState` if all the state does is trigger `useEffect`. Instead, use the function directly.

### When to not `useState` - Refactoring into Derived States

Another place where you should not use `useState` is when you're using data from a prop or context.
As long as the `setState` functions is not used, this will apply.

For example, instead of the following:

```jsx
import useCompositeUser from "@/hooks/compositeUser.js";
import dpGeneric from "@/assets/images/dpGeneric.png";

function ProfilePhoto() {
  const compUsr = useCompositeUser();

  const [photoUrl, setPhotoUrl] = useState(
    compUsr.userCtx.user.profilePhotos?.medium || dpGeneric
  );

  return <img alt={"Profile Photo"} src={photoUrl} />;
}
```

You can refactor into:

```jsx
import useCompositeUser from "@/hooks/compositeUser.js";
import dpGeneric from "@/assets/images/dpGeneric.png";

function ProfilePhoto() {
  const compUsr = useCompositeUser();
  const photoUrl = compUsr.userCtx.user.profilePhotos?.medium || dpGeneric;
  return <img alt={"Profile Photo"} src={photoUrl} />;
}
```

This is also known as derived states.

### Forms v/s State & `onChange`

When working with forms, it is common to use `useState` to manage form state and `onChange` to update the state when the user types in the form.

However, in thhis application, we will use forms and submit buttons to collect data. This reduces some complexity but can make the application less responsive.

This is done as follows:

```jsx
function handleSubmit(event) {
  event.preventDefault();
  const uid = event.target[0].value;
  const password = event.target[1].value;
  // Do something with uid and password
}

return (
  <form onSubmit={handleSubmit}>
    <input type="text" placeholder="UID" />
    <input type="password" placeholder="Password" />
    <button type="submit">Submit</button>
  </form>
);
```

### Properly using `navigate`

`navigate` is a function provided by `react-router-dom` that is used to navigate programmatically. It is used to navigate to a different page in the application.

`navigate` has been used in 3 ways in this application:

- To navigate to a different page in the application.
  ```jsx
  const navigate = useNavigate();
  ...
  navigate(PageUrls.CONSTANT);
  ```
- To navigate to a different page in the application with URL parameters.
  ```jsx
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  ...
  searchParams.set("action", ActionParams.CONSTANT);
  navigate({
    pathname: PageUrls.PAGE_CONSTANT,
    search: searchParams.toString(),
  });
  ```
- To navigate to the previous page in the application.
  ```jsx
  const navigate = useNavigate();
  ...
  navigate(-1);
  ```

**Note**: `navigate` is to be used inside event handlers or in functions that are called in event handlers or in `useEffect` hooks. Using `navigate` directly in the component body may cause errors.

### Search Parameters

Search parameters are used to pass data between pages in the application. They are used to pass data that is not sensitive and can be shared between pages.

Search parameters are used in the following way:

- To get search parameters in a page.
  ```jsx
  const [searchParams] = useSearchParams();
  const key = searchParams.get("action");
  ```
- To set search parameters in a page.
  ```jsx
  const [searchParams] = useSearchParams();
  searchParams.set("action", ActionParams.CONSTANT);
  ```
- To check if a search parameter exists in a page.
  ```jsx
  const [searchParams] = useSearchParams();
  const hasKey = searchParams.has("action");
  ```

The hook `useSearchParams` also returns a `setSearchParams` function that can be used to update the search parameters in the URL. However, this function is not used in this application. Instead, the `searchParams` object is converted to a string and passed to the `navigate` function during navigation.

### Firebase Wrapper Usage

Use existing wrappers in [`modules/firebase/*.js`](../src/modules/firebase) to perform operations on remote (auth, database, firestore, storage, etc.).

If you need a different functionality, create a wrapper first. See the wrapper functions already defined to get an idea of:

- Initialization
- Logic flow
- Error cleanup
- Error reporting

**Note**: You may sometimes want to link a react state to a firebase listener. For e.g. the `AuthProvider` internally uses `onAuthStateChanged`.

However, for certain auth operations like `updateProfile`, `onAuthStateChanged` is not triggered. In such cases, you need to work as follows:

```jsx
onAuthStateChanged((user) => compUsr.userCtx.setUser(User.from(user)));
...
getSomePayload()
  .then((payload) => updateProfile(payload))
  .then(() => compUsr.userCtx.setUser(User.updateByPayload(payload)))
  .catch((e) => notify(e, "error"));
```

Points to note:

1. `updateProfile` is a remote function. This is to be given priority over local state updates.
2. `compUsr.userCtx.setUser` is local state update. It should happen after remote update.
3. `catch` will generally have a call of `notify` with the string of error. This is to be done to report errors as they occur.

All errors received from firebase wrappers are guaranteed to be user friendly messages.

## Linting and Beautification

Create React App uses ESLint internally and is not configured anywhere else. However, ESLint is disabled during production builds because sometimes certain warnings may need to be ignored. However...

**WARNING**: Fix any ESLint warnings or errors during development. Otherwise, you may be introducing bugs or convoluted logic. Refactor and modify your logic, especially if you have missing dependencies in `useEffect` or `useCallback`.

Prettier is a recommended extension for VSCode. Only run Pretter on `.js` and `.jsx` files.
