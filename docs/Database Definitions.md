# Database Definitions
- [Types](#types)
  - [Address](#address)
  - [Gender](#gender)
  - [Profession](#profession)
  - [TokenType](#tokentype)
  - [OtpType](#otptype)
  - [ProfileType](#profiletype)
- [Hard Entities](#hard-entities)
    - [Account](#account)
    - [Profile](#profile)
        - [Provider](#provider-owner)
        - [Tenant](#tenant)
    - [Room](#room)
    - [Booking](#booking)
- [Soft Entities](#soft-entities)
    - [Identity](#identity)
    - [Token](#token)
    - [OTP](#otp)
    - [Notification](#notification)
    - [Feedback](#feedback)
## Types
### Address
```ts
type Address {
  geoloc_lat number  valid(-90, 90)   // Latitude
  geoloc_lon number  valid(-180, 180) // Longitude
  houseno    string? valid(none)      // Flat, Floor, House No, etc
  landmark   string? valid(none)      // Nearby landmark
  street     string? valid(none)      // Street name, Locality, etc
  city       string  valid(none)      // City name
  pincode    string  valid(/^\d{6}$/) // Postal code
}
```
### Gender
```ts
enum Gender {
  MALE
  FEMALE
  OTHER
}
```
### Profession
```ts
enum Profession {
  STUDENT
  WORKING
}
```
### TokenType
```ts
enum TokenType {
  ACCESS
  REFRESH
}
```
### OtpType
```ts
enum OtpType {
  EMAIL
  MOBILE
}
```
### ProfileType
```ts
enum ProfileType {
  ROOM_TENANT
  ROOM_PROVIDER
}
```
## Hard Entities
### Account
```ts
Account {
  account_id        string pk      valid(/^[A-Z0-9]{16}$/)
  email             string?        valid(empty or /^.+@.+$/)
  email_isverified  boolean
  country_code      string         valid(/^\d+$/)
  mobile            string unique  valid(/^\d+$/)
  mobile_isverified boolean
}
```
#### Notes:
- Accounts are passwordless and use OTPs for verification.
- Login is allowed using both email or mobile number.
- `account_id` is a unique random 16 byte string containing 0-9 and A-Z (capital).
  - This is used as a primary key for the account.
  - This is used as a primary key for `Identity` as well.
  - Generated using custom generator (preferably auto-incrementing, random might cause collisions).
  - Uniqueness ensured at database level.
- `email` is optional.
- `mobile` is mandatory.
- An account can neither be deactivated nor deleted.

### Profile
#### Provider (Owner)
```ts
ProviderProfile {
  profile_id   string pk
  account_id   string fk unique     valid(/^[A-Z0-9]{16}$/)
  profile_img  string url
  first_name   string               valid(none)
  last_name    string               valid(none)
  profile_type string ROOM_PROVIDER
  expires_at   Date
}
```
##### Notes:
- `account_id` is the foreign key to the `Account` entity.
- `profile_img` is a direct URL to the profile picture.
  - The URL is rate limited and requires a user to be logged in.
- `expires_at` is the expiry date of the profile.
  - Default expiry date is (CURRENT + 500) years.
  - If user deletes profile, expiry date is set to (CURRENT + 30) days.
  - If user cancels deletion, expiry date is set to (CURRENT + 500) years.
  - Expiry date allows for soft deletion of the profile.

#### Tenant
```ts
TenantProfile {
  // same fields as ProviderProfile
  profile_id           string pk
  account_id           string fk unique   valid(/^[A-Z0-9]{16}$/)
  profile_img          string url
  first_name           string             valid(none)
  last_name            string             valid(none)
  profile_type         string ROOM_TENANT
  expires_at           Date   type

  // additional fields
  gender               Gender       enum
  profession           Profession   enum
  room_mate_gender     Gender       enum
  room_mate_profession [Profession] Set[enum]   valid(len >= 1)
  work_locations       [Address]    [type]      valid(len >= 1)
}
```
##### Notes:
- Profile deletion and reactivation works the same as [`ProviderProfile`](#provider-owner).
- Fields same as `ProviderProfile` have same meaning.
- `work_locations` is a list of addresses where the tenant works.
  - The tenant may work at multiple locations.
  - Work location can be chosen from a searchable dropdown (connects with some Maps API).
  - Additionally, user can enter custom address for the given location.
- `room_mate_profession` is a list of professions the tenant prefers in a room mate.
  - The tenant must select at least one profession.
  - If tenant wants to live with any profession, they can select all professions.
  - If tenant wants to live alone, they can select search for [`Rooms`](#room) with `max_occupants` 1.
  - Alternatively, they can customize `occupant_size` during [`Booking`](#booking) and pay a higher price.

### Room
```ts
Room {
  room_id              string             pk
  provider_account_id  string             fk
  provider_profile_id  string             fk
  accepting_gender     Gender             enum
  accepting_profession [Profession]       Set[enum]  valid(len >= 1)
  aadhaar_isrequired   boolean
  workid_isrequired    boolean
  room_address         Address            type
  image_urls           [string]           [url]      valid(len >= 1)
  facilities           Map[string,string]            valid(len >= 1)
  price_per_occupant   number                        valid(>= 1)
  max_occupants        number                        valid(>= 1)
}
```
#### Notes:
- A room cannot be deleted in any circumstances.
- A room may be deactivated by the provider and reactivated.
- If there are bookings for the room, the room cannot be deactivated.
- Deactivated rooms will not be shown in search results and bookings will not be allowed.
- Deactivated rooms cannot be viewed unless its respective provider is logged in.
- `provider_account_id` is the foreign key to the `Account` entity (this is used mainly for support purposes).
- `provider_profile_id` is the foreign key to the `ProviderProfile` entity (this is used mainly for display purposes).
- `accepting_gender` is used to filter rooms based on `gender` of `TenantProfile`.
- `accepting_profession` is used to filter rooms based on `profession` of `TenantProfile`.
- `aadhaar_isrequired` and `workid_isrequired` are set by the provider.
  - If `true`, the tenant must provide the respective ID for the booking to be applied.
  - The URL is taken from the `Identity` entity. If absent, the tenant will be prompted to upload the ID.
- `room_address` is the location of the room.
  - Location can be chosen from a searchable dropdown (connects with some Maps API).
  - Additionally, provider can enter custom address for the given location.
- `image_urls` is a list of direct URLs to room images.
  - The URL is rate limited and requires a user to be logged in.
- `facilities` is a map of facilities available in the room.
  - The key is the facility name and the value is the description.
- `max_occupants` is the maximum number of tenants that can stay in the room.

### Booking
```ts
RoomBooking {
  booking_id        string pk
  room_id           string fk
  tenant_account_id string fk
  tenant_profile_id string fk
  occupant_size     number    valid(>= 1)
  is_confirmed      boolean
  is_cancelled      boolean
}
```
#### Notes:
- A booking cannot be deleted in any circumstances.
- A booking is a record and remains in the database for future reference.
- However, it is not guaranteed that `fk` references will be valid.
- `room_id` is the foreign key to the `Room` entity.
- `tenant_account_id` is the foreign key to the `Account` entity (this is used mainly for support purposes).
- `tenant_profile_id` is the foreign key to the `TenantProfile` entity (this is used mainly for display purposes).
- `occupant_size` is the number of tenants that will stay in the room. Set by the tenant.
  - If the person wants to share, this will be 1.
  - If the person wants to stay alone, this will equal the `max_occupants` of [`Room`](#room).
  - Any value between 1 and `max_occupants` is allowed but tenant will pay a higher price.
- `is_confirmed` is set by the provider.
  - If `true`, the booking is confirmed and the room is booked.
  - If `false`, the booking is pending and the tenant is waiting for confirmation.
- `is_cancelled` is set by the tenant.
  - If `true`, the booking is cancelled and the room is not booked.
  - If `false`, the booking is active and the room has been occupied by `occupant_size` tenants.

## Soft Entities
### Identity
```ts
Identity {
  account_id  string  pk fk unique valid(/^[A-Z0-9]{16}$/)
  aadhaar_img string? url
  workid_img  string? url
}
```
#### Notes:
- `account_id` is the foreign key to the `Account` entity and the primary key.
- `aadhaar_img` and `workid_img` are direct URLs to ID images.
  - The URL is rate limited and requires a user to be logged in.
  - If the URL is absent, the user will be prompted to upload respective ID when required during booking.
  - Otherwise the ID will be taken from `Identity` entity.

### Token
```ts
Token {
  token_id   string pk
  account_id string fk
  token      string
  token_type TokenType enum
  expires_at Date type
}
```
#### Notes:
- `token` is a simple SHA-256 hash of `account_id` + `expires_at` + `token_type` + `secret` where `secret` is a server-side secret.
- `expires_at` is the expiry date of the token.
  - For access tokens, expiry date will be set to (CURRENT + 1) hour.
  - For refresh tokens, expiry date will be set to (CURRENT + 1) month.
  - If token is to be revoked, expiry date will be set to (CURRENT - 1s).

### OTP
```ts
OTP {
  otp_id     string pk
  account_id string fk
  code       string
  otp_type   OtpType enum
  expires_at Date type
}
```
#### Notes:
- `code` is a random 6 digit number.
- `expires_at` is the expiry date of the OTP.
  - For OTPs, expiry date will be set to (CURRENT + 5) minutes.
  - If OTP is used, expiry date will be set to (CURRENT - 1) seconds.

### Notification
```ts
Notification {
  notification_id string pk
  account_id      string fk
  message         string
  is_read         boolean
  action          string
  expires_at      Date type
}
```
#### Notes:
- `action` is a URI for some API endpoint that executes notification actions.
- `expires_at` is the expiry date of the notification.
  - For notifications, expiry date will be set to (CURRENT + 15) days.
  - If user reads the notification, `is_read` will be set to `true`.

### Feedback
```ts
Feedback {
  feedback_id string pk
  account_id  string fk
  message     string
  image_urls  [string] [url]
  expires_at  Date type
}
```
#### Notes:
- `image_urls` is a list of direct URLs to images.
  - The URL is rate limited and requires a user to be logged in.
- `expires_at` is the expiry date of the feedback.
  - For feedback, expiry date will be set to (CURRENT + 1) months.

### Entity Relationships
- Account 1 - 1 Identity
- Account 1 - * Token
- Account 1 - * OTP
- Account 1 - * Notification
- Account 1 - * Feedback
- Account 1 - 1 ProviderProfile
- Account 1 - 1 TenantProfile
- ProviderProfile 1 - * Room
- Room 1 - * RoomBooking
- TenantProfile 1 - * RoomBooking
