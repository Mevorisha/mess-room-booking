# Mess Booking App - Serverless Frontend

Use `npm start` to start the development server.

If you get he following error

```js
Error: error:0308010C:digital envelope routines::unsupported
{
    opensslErrorStack: [
    'error:03000086:digital envelope routines::initialization error',
    'error:0308010C:digital envelope routines::unsupported'
  ],
  library: 'digital envelope routines',
  reason: 'unsupported',
  code: 'ERR_OSSL_EVP_UNSUPPORTED'
}
```

Run the following command first to fix it

```
export NODE_OPTIONS=--openssl-legacy-provider
```
