# Mess Booking App - Frontend

Use `npm run emulate` to start the development server and emulate the Firebase backend.

**Note**:
- Auth is not emulated coz reCAPTCHA doesn't work in the emulator.
- Hosting is not emulated coz we're using Create React App's dev server.

If you get he following error

```js
Error: error:0308010C:digital envelope routines::unsupported
```

Run the following command first to fix it

```
export NODE_OPTIONS=--openssl-legacy-provider
```

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for more information on how to contribute.
