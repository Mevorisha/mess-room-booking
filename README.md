# Mevorisha PG Rooms

## Usefull Links

- [Logic Flow Diagram](https://drive.google.com/file/d/1lHRElkUKRZCq4yYhZ1q_NPGragjW66Lx/view?usp=sharing)
- [Database Schema](https://app.eraser.io/workspace/Lf2WNiNdLvDaQM02qq8B?origin=share&elements=_KtLviIBjFqGphKmprVRmw)
- [API Documentation](#endpoints)
- [Amplify Documentation](amplify/README.md)
  - [Lambda JS Layer](amplify/backend/function/mevorishapgroomsCommonJsModules/README.md)
  - [Lambda Auth Routes](amplify/backend/function/RestApiV1Auth/README.md)
- [Frontend Documentation](src/README.md)

## Requirements

- yarn
- npm
- node ^18.18.0
- aws amplify v6
- amplify cli
- aws account

## Endpoints

- [Util](#util)
- [Auth](#auth)
  - [POST /auth/register](#post-authregister)
  - [POST /auth/login](#post-authlogin)
  - [POST /auth/resend-otp](#post-authresend-otp)
  - [POST /auth/verify-mobile-and-login](#post-authverify-mobile-and-login)
  - [POST /auth/request-email-verification](#post-authrequest-email-verification)
  - [POST /auth/verify-email](#post-authverify-email)
  - [POST /auth/logout](#post-authlogout)
  - [POST /auth/refresh](#post-authrefresh)
- [Identity](#identity)
  - [GET /identity?countryCode=[string]&mobile=[string]](#get-identitycountrycodestringmobilestring)
  - [PUT /identity/idcard](#put-identityidcard)
  - [PUT /identity/aadhaar](#put-identityaadhaar)
- [Profile](#profile)
  - [GET /profile](#get-profile)
  - [PUT /profile](#put-profile)
  - [GET /profile/job-location?lat=[number]&lon=[number]](#get-profilejob-locationlatnumberlonnumber)
  - [PUT /profile/job-location](#put-profilejob-location)
  - [DELETE /profile/job-location?lat=[number]&lon=[number]](#delete-profilejob-locationlatnumberlonnumber)

URLs uses 3 part format: `/api-function/route?query1=xyz1&query2=xyz2`

- 1st part: determines API Gateway function
- 2nd part: determines route within the function (optional)
- 3rd part: query parameters (optional)

Unless specified, all endpoints have a rate limiting of the following:

- Per IP: 10 API calls per endpoint every 5 minute

### Response on error

```ts
{
    status: number,
    message: string,
}
```

The `message` field is a human-readable error message that may be directly displayed to the end user.

### Authorization

All endpoints require a valid JWT token in the `Authorization` header. The token is obtained by logging in.

Token format:

- `Bearer <token>`
- Should be access token

## Util

Set of utility and helper APIs for certain data processing.

## Auth

OTP is only sent to the mobile number during login and registration.

Email verification is done separately.

### POST /auth/register

Authorization:

- User needs not be logged in
- Frontend should track OTP expiration and ask user to resend OTP if expired
- In next step, user should be asked to enter OTP and verify

Request body:

```ts
{
    email?: string<email>,
    countryCode: string</^\+[0-9]+$/>,
    mobile: string</^[0-9]+$/>,

    profileImage: {
        mime: string</^image\/.+$/>,
        data: string<base64>,
    }
    firstName: string</^[A-Z][a-z]+$/>,
    lastName: string</^[A-Z][a-z]+$/>,
    profileType: "ROOM_PROVIDER"
}
```

Or

```ts
{
    email?: string<email>,
    countryCode: string</^\+[0-9]+$/>,
    mobile: string</^[0-9]+$/>,

    profileImage: {
        mime: string</^image\/.+$/>,
        data: string<base64>,
    }
    firstName: string</^[A-Z][a-z]+$/>,
    lastName: string</^[A-Z][a-z]+$/>,
    profileType: "ROOM_TENANT",

    gender: "MALE" | "FEMALE" | "TRANS",
    profession: "STUDENT" | "WORKING",
    roomMateGender: [ "MALE" | "FEMALE" | "TRANS" ]
    roomMateProfession: [ "STUDENT" | "WORKING" ],
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 500: `Internal server error`

Response body:

```ts
{
    otpId: string,
    expiresAt: Date,
}
```

### POST /auth/login

Authorization:

- User needs not be logged in
- Frontend should track OTP expiration and ask user to resend OTP if expired
- In next step, user should be asked to enter OTP and verify
- Don't send OTP if user doesn't exist

Request body:

```ts
{
    countryCode: string</^\+[0-9]+$/>,
    mobile: string</^[0-9]+$/>,
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 500: `Internal server error`

Response body:

```ts
{
    otpId: string,
    expiresAt: Date,
}
```

### POST /auth/resend-otp

Authorization:

- User needs not be logged in
- Frontend should track OTP expiration and ask user to resend OTP if expired
- In next step, user should be asked to enter OTP and verify

Request body:

```ts
{
    otpId: string,
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 404: Not Found, `OTP ID is invalid`
- 500: `Internal server error`

Response body:

```ts
{
    otpId: string,
    expiresAt: Date,
}
```

### POST /auth/verify-mobile-and-login

Authorization:

- User needs not be logged in
- Frontend should store tokens if returned status is `200`

Request body:

```ts
{
    code: string,
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 401: Unauthorized, `OTP is invalid or expired`
- 500: `Internal server error`

Response body:

```ts
{
    access: {
        token: string,
        expiresAt: Date,
    },
    refresh: {
        token: string,
        expiresAt: Date,
    },
}
```

### POST /auth/request-email-verification

Authorization:

- User must be logged in
- Frontend should track OTP expiration and ask user to resend OTP if expired
- In next step, user should be asked to enter OTP and verify
- Don't send OTP if user doesn't exist or email is not provided

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Request body:

```ts
{
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 403: Forbidden, `User is not logged in`
- 500: `Internal server error`

Response body:

```ts
{
    otpId: string,
    expiresAt: Date,
}
```

### POST /auth/verify-email

Authorization:

- User needs not be logged in
- Frontend should store tokens if returned status is `200`

Request body:

```ts
{
    code: string,
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 401: Unauthorized, `OTP is invalid or expired`
- 500: `Internal server error`

Response body:

```ts
{
}
```

### POST /auth/logout

Authorization:

- User must be logged in
- Frontend should clear tokens if returned status is `200`
- In this case, backend should also revoke both of the tokens

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Request body:

```ts
{
}
```

Errors:

- 403: Forbidden, `User is not logged in`
- 500: `Internal server error`

Response body:

```ts
{
}
```

### POST /auth/refresh

Authorization:

- Authorization header is not required
- Refresh token must be valid

Request body:

```ts
{
    refreshToken: string,
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 401: Unauthorized, `Refresh token is invalid or expired`
- 500: `Internal server error`

Response body:

```ts
{
    access: {
        token: string,
        expiresAt: Date,
    },
    refresh: {
        token: string,
        expiresAt: Date,
    },
}
```

## Identity

### GET /identity?countryCode=[string]&mobile=[string]

Authorization:

- User must be logged in
- User should be of type `ROOM_PROVIDER`
- Need to check if user of `mobile` has booked a room provided by this user
  - If so, the room of this booking should have asked for aaadhar and/or id card
  - If a specific document is not asked for, null should be returned for that document
- Also, if user of `mobile` has not uploaded the document, null should be returned for that document

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Errors:

- 403: Forbidden, `User is not logged in`
- 404: Not Found, `User with mobile number not found`
- 500: `Internal server error`

Response body:

```ts
{
    idcard?: {
        mime: string</^image\/.+$/>,
        data: string<base64>,
    },
    aadhaar?: {
        mime: string</^image\/.+$/>,
        data: string<base64>,
    },
}
```

### PUT /identity/idcard

Authorization:

- User must be logged in

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Request body:

```ts
{
    mime: string</^image\/.+$/>,
    data: string<base64>,
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 403: Forbidden, `User is not logged in`
- 500: `Internal server error`

Response body:

```ts
{
}
```

### PUT /identity/aadhaar

Authorization:

- User must be logged in

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Request body:

```ts
{
    mime: string</^image\/.+$/>,
    data: string<base64>,
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 403: Forbidden, `User is not logged in`
- 500: `Internal server error`

Response body:

```ts
{
}
```

## Profile

### GET /profile

Authorization:

- User must be logged in
- In backend, `account.profileId === profile.id`

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Errors:

- 403: Forbidden, `User is not logged in`
- 500: `Internal server error`

Response body:

```ts
{
    profileImage: {
        mime: string</^image\/.+$/>,
        data: string<base64>,
    },
    firstName: string</^[A-Z][a-z]+$/>,
    lastName: string</^[A-Z][a-z]+$/>,
    type: "ROOM_PROVIDER"
}
```

Or

```ts
{
    profileImage: {
        mime: string</^image\/.+$/>,
        data: string<base64>,
    },
    firstName: string</^[A-Z][a-z]+$/>,
    lastName: string</^[A-Z][a-z]+$/>,
    type: "ROOM_TENANT",

    gender: "MALE" | "FEMALE" | "TRANS",
    profession: "STUDENT" | "WORKING",
    roomMateGender: ["MALE" | "FEMALE" | "TRANS"],
    roomMateProfession: ["STUDENT" | "WORKING"],
    jobLocations: [
        {
            name: string,
            lat: number,
            lon: number,
        }
    ]
}
```

### PUT /profile

Authorization:

- User must be logged in
- In backend, `account.profileId === profile.id`
- Only `ROOM_TENANT` can update `gender`, `profession`, `roomMateGender`, `roomMateProfession`

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Request body:

```ts
{
    profileImage?: {
        mime: string</^image\/.+$/>,
        data: string<base64>,
    },

    firstName?: string</^[A-Z][a-z]+$/>,
    lastName?: string</^[A-Z][a-z]+$/>,

    gender?: "MALE" | "FEMALE" | "TRANS",
    profession?: "STUDENT" | "WORKING",
    roomMateGender?: ["MALE" | "FEMALE" | "TRANS"],
    roomMateProfession?: ["STUDENT" | "WORKING"],
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 403: Forbidden, `User is not logged in`
- 500: `Internal server error`

Response body:

```ts
{
}
```

### GET /profile/job-location?lat=[number]&lon=[number]

Authorization:

- User must be logged in
- In backend, `account.profileId === profile.id`
- Profile must be of type `ROOM_TENANT`
- `lat` and `lon` should be in the user's job locations

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Errors:

- 403: Forbidden, `User is not logged in`
- 404: Not Found, `Job location not found`
- 500: `Internal server error`

Response body:

```ts
{
    name: string,
}
```

### PUT /profile/job-location

Authorization:

- User must be logged in
- In backend, `account.profileId === profile.id`
- Profile must be of type `ROOM_TENANT`

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Request body:

```ts
{
    lat: number,
    lon: number,
}
```

Errors:

- 400: Bad Request, `Invalid request body`
- 403: Forbidden, `User is not logged in`
- 500: `Internal server error`

Response body:

```ts
{
    name: string,
}
```

### DELETE /profile/job-location?lat=[number]&lon=[number]

Authorization:

- User must be logged in
- In backend, `account.profileId === profile.id`
- Profile must be of type `ROOM_TENANT`

Request headers:

```ts
{
    Authorization: string</^Bearer .+$/>
}
```

Errors:

- 403: Forbidden, `User is not logged in`
- 500: `Internal server error`

Response body:

```ts
{
}
```
