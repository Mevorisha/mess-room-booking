# Mess Booking App - API Documentation

## General Notes
- **Error Handling**: All error responses have an HTTP status code and a JSON body `{ message: string }`, which should be displayed directly to the user.
- **Pagination**: Endpoints supporting query-based listing (e.g., `readListOnQuery`) expect query parameters like `perPageLimit`, `currentPage`, `sortOn`, and `sortOrder`.
- **Image Retrieval**: `readImage` endpoints return a single image via HTTP as `image/*`.

## Environment Variables
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase service account key in JSON format.
- `FIREBASE_DATABASE_URL`: URL of the Firebase Realtime Database.
- `FIREBASE_STORAGE_BUCKET`: Firebase Storage bucket name.
  
---

## Schema

### Identity
Used by profile and identity documents
```
email: string
type: "OWNER" | "TENANT"
firstName?: string
lastName?: string
mobile?: string
language?: "ENGLISH" | "BANGLA" | "HINDI"
profilePhotos?: {
  small: string
  medium: string
  large: string
}
identityPhotos?: {
  workid?: {
    small: string
    medium: string
    large: string
  }
  govid?: {
    isPrivate: boolean
    small: string
    medium: string
    large: string
  }
  workIdIsPrivate?: boolean
  govIdIsPrivate?: boolean
}
ttl?: timestamp
```

### Booking
```
tenantId: string
roomId: /rooms/{roomId}
occupantCount: number
requestedOn: timestamp
acceptance?: "ACCEPTED" | "REJECTED"
acceptedOn?: timestamp
cancelledOn? timestamp
clearedOn?: timestamp
ttl?: timestamp
```

### Room
```
ownerId: string
acceptGender: "MALE" | "FEMALE" | "OTHER"
acceptOccupation: "STUDENT" | "PROFESSIONAL" | "ANY"
landmarkTags: Set<string>
address: string
city: string
state: string
majorTags: Set<string>
minorTags: Set<string>
images: Array<string>
capacity: number
pricePerOccupant: number
ttl?: timestamp
```

---

## Accounts Endpoints

### Delete User Account
`DELETE /api/accounts/{uid}/delete`
- Sets up the account for deletion with TTL of 30 days. On deletion, all associated data in Profile, Rooms, and Bookings will be deleted.

### Read User Account
`GET /api/accounts/{uid}/read`
- Retrieves account details for a given user ID.

---

## Bookings Endpoints

### Create Booking
`POST /api/bookings/create`
- Creates a new booking.

### Read Bookings List (With Query Params)
`GET /api/bookings/readListOnQuery`
- Retrieves a list of bookings based on query parameters:
  - `perPageLimit`
  - `currentPage`
  - `sortOn`
  - `sortOrder`
  - `searchText`

### Read Booking Details
`GET /api/bookings/{bookingId}/read`
- Retrieves details of a specific booking.

### Update Booking Acceptance
`PATCH /api/bookings/{bookingId}/updateIsAccpted`
- Sets or updates the acceptance status of a booking. Only the owner of the room can accept a booking.

### Update Booking Clearance or Cancellation
`PATCH /api/bookings/{bookingId}/updateIsClearedOrCancelled`
- Sets or updates the booking status to cleared or cancelled. Only the tenant can clear or cancel a booking.

---

## Identity Documents Endpoints

### Read Government ID Image
`GET /api/identityDocs/{uid}/GOV_ID/readImage`
- Retrieves the user's government ID image as `image/*`.

### Update Government ID Image
`PATCH /api/identityDocs/{uid}/GOV_ID/updateImage`
- Sets or updates the user's government ID image.

### Update Government ID Visibility
`PATCH /api/identityDocs/{uid}/GOV_ID/updateVisibility`
- Updates the visibility settings of the user's government ID.

### Read Work ID Image
`GET /api/identityDocs/{uid}/WORK_ID/readImage`
- Retrieves the user's work ID image as `image/*`.

### Update Work ID Image
`PATCH /api/identityDocs/{uid}/WORK_ID/updateImage`
- Sets or updates the user's work ID image.

### Update Work ID Visibility
`PATCH /api/identityDocs/{uid}/WORK_ID/updateVisibility`
- Updates the visibility settings of the user's work ID.

---

## Profile Endpoints

### Read Profile
`GET /api/profile/{uid}/read`
- Retrieves the profile details for a given user ID.

### Read Image
`GET /api/profile/{uid}/readImage`
- Retrieves the profile photo of the user as `image/*`.

### Update Profile Language
`PATCH /api/profile/{uid}/updateLanguage`
- Sets or updates the language of the user profile. This is used to return error messages in the user's preferred language.

### Update Profile Mobile
`PATCH /api/profile/{uid}/updateMobile`
- Sets or updates the mobile number of the user.

### Update Profile Name
`PATCH /api/profile/{uid}/updateName`
- Sets or updates the name of the user in profile.

### Update Profile Photo
`PATCH /api/profile/{uid}/updatePhoto`
- Sets or updates the profile photo of the user.

### Update Profile Type
`PATCH /api/profile/{uid}/updateType`
- Sets or updates the profile type of the user.

---

## Rooms Endpoints

### Create Room
`POST /api/rooms/create`
- Creates a new room.

### Read Room List (With Query Params)
`GET /api/rooms/readListOnQuery`
- Retrieves a list of rooms based on query parameters:
  - `perPageLimit`
  - `currentPage`
  - `sortOn`
  - `sortOrder`
  - `searchText`

### Create Room Image
`POST /api/rooms/{roomId}/createImage`
- Uploads an image to a room.

### Read Room Details
`GET /api/rooms/{roomId}/read`
- Retrieves details of a specific room.

### Update Room Availability
`PATCH /api/rooms/{roomId}/updateAvailability`
- Updates the availability status of a specific room. This settings affects the visibility of the room in search results and prevents new bookings. A booked room cannot be made unavailable.

### Update Room Parameters
`PATCH /api/rooms/{roomId}/updateParams`
- Updates the parameters of a specific room.

### Delete Room Image
`DELETE /api/rooms/{roomId}/{imageId}/delete`
- Deletes a specific room image.

### Read Room Image
`GET /api/rooms/{roomId}/{imageId}/readImage`
- Retrieves a specific room image as `image/*`.

### Update Room Image
`PATCH /api/rooms/{roomId}/{imageId}/updateImage`
- Updates a specific room image.
