# End User API

## Common Notes

### Errors
All errors will be returned in the following format:
```ts
{
  syscode: string,
  message: string
}
```
Where `syscode` is a string that represents the error (used for debugging) and `message` is a human-readable message that describes the error.
The message will be in English and will be displayed to the user as is.

Note that the `syscode` **IS NOT** the same as HTTP status code. Also the `syscode` **SHOULD NOT** be displayed to the user as it is a technical detail.

To determine if the request was successful, check the HTTP status code.
If status code is not `200`, then the error response (as described above) will be returned.

The possible status codes are:
- `200`: There were no errors and proper response was returned.
- `400`: The request was malformed or invalid and the cause is omitted.
- `401`: The user is not not logged in or the credentials are invalid.
- `403`: The user does not have the required permissions to access the resource.
- `404`: The resource was not found or was removed.
- `429`: Too many requests so the user should retry after some time.
- `500`: Error in server code and the cause is omitted.

No other status codes apart from the ones mentioned above will be returned.

### Authorization
Some APIs require an `Authorization` header with `Bearer <access_token>` to be set in the request headers. Hence, the frontend should set this header for all requests. See the [Token](#Token) API for more information on refreshing the access token.

#### Authorization Errors
- `401`: "User credentials invalid or expired"
  - The token used is invalid or expired.
  - Auto-handle by refreshing the access token.
  - If error persists, ask the user to login or reload the page.
- `403`: "Permission to access resource denied"
  - The user does not have the required permissions to access the resource.
  - There is no way to auto-handle this error.
  - Don't access the resource or ask the user to contact support.

For all authorization errors a log with the `syscode`, `account_id` of user and the API call made will be stored in server.

### Rate Limiting
Some APIs are rate limited to prevent abuse. The rate limit is set varies with endpoints. If the rate limit is exceeded, the server will return a `429` status code with the message "Too many requests. Please retry after some time."

## Utilities

### POST `/api/v1/util/image`
Upload an image to the server and get the URL path.

Requires authorization to upload the image:
- A valid access token is required in the `Authorization` header.
- This prevents people from using the server as a free image hosting service.
- Rate limited to overall 10 requests per minute.

#### Request
```ts
{
  image: string
}
```
Where `image` is the base64 encoded image.

#### Response
```ts
{
  path: string
  url: string
}
```
Where `path` is the path to the image on the server and `url` is a direct link to the image. The `url` is formed by joining the `path` with the server's base URL (i.e. they are the same thing).

The `url` syntax is `https://<server_base_url>/api/v1/util/image/<path>` and is described in the [Get Image](#get-apiv1utilimagepath) API.

### GET `/api/v1/util/image/:path`
Get the image from the server as a proper image. This is used to display the image in the app.

Requires authorization to view the image:
- A valid access token is required in the `Authorization` header.
- This prevents people from using the server as a free image hosting service.
- There is no rate limiting on this endpoint.

#### Response
The image as a proper image file and the content type is `image/*`.

### GET `/api/v1/util/location/:query`
##### Deprecated Coz there are better ways to get location data

Requires user to be logged in:
- A valid access token is required in the `Authorization` header.
- Prevents the endpoint from being used as a free location search service.
- Rate limited to 15 requests per account per minute.

#### Response
```ts
{
  lat: number,
  lon: number
}
```
Where `lat` is in range `[-90, 90]` and `lon` is in range `[-180, 180]`.

Gets the location as latitude and longitude from the query string. This is used when an API asks for a geo-location in latitude and longitude format.

The `query` is a string that can be a location name or a partial location name. The API will return the best match for the query.

## Account

## Profile

## Room

## Booking

## Identity

## Token

### POST `/api/v1/token/refresh`
Refresh the access token using the refresh token.
Does not require authorization header because the access token is expired and the refresh token is used as the authorization. No rate limiting on this endpoint.

#### Request
```ts
{
  refresh_token: string
}
```
Where `refresh_token` is the refresh token.

#### Response
```ts
{
  access_token: string,
  access_token_expiry: number,
  refresh_token: string,
  refresh_token_expiry: number
}
```
Where `access_token` is a new access token and `refresh_token` is a **NEW** refresh token.

Expiry dates are in Unix timestamp format and are as follows:
- Access token expires 1 hour after the current time.
- Refresh token expires 1 month after the current time.

Notes:
- Old refresh token is invalidated and cannot be used again.
- Frontend should update the access token and refresh token in the local storage.

#### Errors
- `401`: "Invalid or expired credentials"
  - The refresh token is invalid or expired.
  - In such cases, the user should be considered logged out and the frontend should redirect the user to the login page.

### POST `/api/v1/token/revoke`
Revoke the refresh token and log the user out. This revokes the specific refresh token and all access tokens for the user. This is alright because the access token is short-lived and can be generated again.

This endpoint is same as logging out the user.

Authorization is is not needed because the refresh token is used as the authorization. No rate limiting on this endpoint.

#### Request
```ts
{
  refresh_token: string
}
```
Where `refresh_token` is the refresh token of the current device.

#### Response
```ts
{}
```

### POST `/api/v1/token/revoke-all`
Revoke all refresh tokens and log the user out from all devices. This revokes all refresh tokens and access tokens for the user.

This endpoint is same as logging out the user from all devices.

Authorization is is not needed because the current refresh token is used as the authorization. No rate limiting on this endpoint.

#### Request
```ts
{
  refresh_token: string
}
```
Where `refresh_token` is the refresh token of the current device.

#### Response
```ts
{}
```

## OTP

## Notification

## Feedback
