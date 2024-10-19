# API Reference

## Common Notes

### Authorization
Some APIs require an `Authorization` header with `Bearer <access_token>` to be set in the request headers. Hence, the frontend should set this header for all requests. See the [Token](#Token) API for more information on refreshing the access token.

### Errors
All errors will be returned in the following format:
```ts
{
  code: number,
  message: string
}
```
Where `code` is an HTTP status code and `message` is a human-readable error message that can be displayed to the end user directly.

## Utilities

### POST `/api/v1/util/image`
Upload an image to the server and get the URL path.

Requires authorization to upload the image:
- A valid access token is required in the `Authorization` header.
- This prevents people from using the server as a free image hosting service.
- And of course the endpoint is rate limited at overall 10 requests per minute.

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
  url: string
}
```
Where `url` is the path to the image in the storage. This URL can be used whenevr an API asks for an `image_url`.

### GET `/api/v1/util/image/:path`
Get the image from the server as a proper image. This is used to display the image in the app.

Requires authorization to view the image:
- A valid access token is required in the `Authorization` header.
- This prevents people from using the server as a free image hosting service.
- There is no rate limiting on this endpoint.

### GET `/api/v1/util/location/:query`
##### Deprecated Coz there are better ways to get location data

Requires user to be logged in:
- A valid access token is required in the `Authorization` header.
- Prevents the endpoint from being used as a free location search service.
- Rate limited to 15 requests per account per minute (coz seriously, how many locations can you search for in a minute?).

Get the location as latitude and longitude from the query string. This is used when an API asks for a geo-location in latitude and longitude format.

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
  refresh_token: string
}
```
Where `access_token` is a new access token and `refresh_token` is a **NEW** refresh token.

Notes:
- Old refresh token is invalidated and cannot be used again.
- Frontend should update the access token and refresh token in the local storage.

#### Errors
- `401`: "Invalid or expired credentials"
  - The refresh token is invalid or expired.

## OTP

## Notification

## Feedback
