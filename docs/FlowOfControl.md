# User Onboarding
## Notes:
- [ ] Verification prompts for mobile number or email may be dialog boxes or separate pages.
- [ ] Update profile page may be a separate page or a dialog box.

## Page 1: Welcome to the App
- [ ] User sees a welcome screen with a description of the app.
- [ ] User sees two buttons: "Sign Up" and "Log In".
- [ ] User clicks "Sign Up" and is taken to the Sign Up page.

## Page 2: Sign Up
- [ ] Ask for country code + mobile number.
- [ ] Buttons "Verify", "Resend", "Previous" and "Next"
- [ ] Disabled "Next" button until the mobile number is verified.
- [ ] Disabled "Resend" button with a countdown timer.
- [ ] User clicks "Verify" and "Next" button is enabled.
- [ ] User clicks "Next"
- [ ] By now an account has been created
- [ ] User is taken to the "Enter Email" page.

## Page 2.1: Log In
- [ ] Ask for country code + mobile number.
- [ ] Gives option to sign in via email.
- [ ] Buttons "Verify", "Resend", "Previous" and "Next"
- [ ] Disabled "Next" button until the mobile number is verified.
- [ ] Disabled "Resend" button with a countdown timer.
- [ ] User clicks "Verify" and "Next" button is enabled.
- [ ] User clicks "Next"
- [ ] By now the user is logged in
- [ ] User is taken to the "Home" page (or "Create Profile" page if user has no existing profile).

## Page 3: Enter Email
- [ ] Buttons "Verify", "Resend", "Previous" and "Next"
- [ ] Additional button "Skip" to skip entering email (you can't have unverified email)
- [ ] Disabled "Next" button until the email is verified.
- [ ] Disabled "Resend" button with a countdown timer.
- [ ] User clicks "Verify" and "Next" button is enabled.
- [ ] User clicks "Next"
- [ ] By now the email has been added to the account
- [ ] User is taken to the "Create Profile" page.

## Exception: User quits the app
- [ ] User will be greeted with the welcome screen if not logged in.
- [ ] User can click "Log In" and go through the login process.
- [ ] User will be greeted with the "Create Profile" page if already logged in.
- [ ] They'll be taken greeted with the "Create Profile" page.
- [ ] If they did not go to the "Enter Email" page, they will not be asked to enter email.
- [ ] To add an email, they can go through the update account process later.

## Page 4: Create Profile
- [ ] User sees a form with fields: "First Name", "Last Name", "Profile Picture (optional)", "Bio (optional)", "Profile Type".
- [ ] There are two types of profiles: "Tenant" and "Provider".
- [ ] If the user selects "Tenant", they will be given the "Next" button.
- [ ] If the user is a "Provider", they will be given the "Create Profile" button.
- [ ] If the user is a "Tenant", they will be taken to the "Tenant Preferences" page.

## Exception: User quits the app
- [ ] If the "Provider" user quits the app at this point without clicking "Create Profile", profile **WILL NOT** be created.
- [ ] If the "Tenant" user quits the app at this point without clicking "Next", profile data entered till now **WILL NOT** be saved.
- [ ] Only after the "Tenant Preferences" page will the "Tenant" profile will be created.

## Page 5: Tenant Preferences
- [ ] User sees a form with fields: "Gender", "Profession", "Room Mate Gender Preference", "Room Mate Profession Preference", "Location Preference".
- [ ] "Gender" is single select.
- [ ] "Profession" is single select.
- [ ] "Room Mate Gender Preference" is single select.
- [ ] "Room Mate Profession Preference" is multi select.
- [ ] "Location Preference" is multi select from searchable dropdown (connects with Google Maps API).
- [ ] Additionally, user can enter custom address for the given location.
- [ ] Multiple locations can be added.
- [ ] User clicks "Create Profile" and the profile is created.
- [ ] User is taken to the "Home" page.

## Exception: User quits the app
- [ ] If the "Tenant" user quits the app at this point without clicking "Create Profile", profile **WILL NOT** be created and all data entered till now **WILL NOT** be saved.

## Page 6: Home Page
- [ ] Home page varies based on the user type.
- [ ] "Tenant" user will see a list of "Rooms" available for each location in profile that matches their preferences.
- [ ] "Tenant" user can click on a "Room" to see more details. This takes them to the "Room Details (Tenant)" page.
- [ ] Additionally, another tab will show "Room Bookings" that the user has applied for.
- [ ] Clicking on a "Room Booking" will take the user to the "Room Booking Details (Tenant)" page.
- [ ] "Provider" user will see a list of "Room Bookings" that other tenants have applied for.
- [ ] Clicking on a "Room Booking" will take the user to the "Room Booking Details (Provider)" page.
- [ ] Additionally, another tab will show "Rooms" that the user has listed.
- [ ] Clicking on a "Room" will take the user to the "Room Details (Provider)" page.
- [ ] There will also be a "Profile" icon that will take the user to the "Account and Profiles" page.

## Page 7: Account and Profiles
- [ ] User sees two tabs: "Account" and "Profile".
- [ ] "Account" tab will show the user's account details (mobile number, email and system generated account ID).
- [ ] The account ID can be used for customer support if user has lost both mobile number and email (or no email was provided and mobile number is lost).
- [ ] Otherwise, either mobile number or email can be used for support.
- [ ] There will be buttons to "Change Mobile Number" and "Change Email".
- [ ] An aditional button "Delete Account" will be shown. If clicked, user will be asked for confirmation. On confirmation, the account will be deactivated for 30 days and then permanently deleted.
- [ ] User will be logged out and taken to the "Welcome" page. If they log in again within 30 days, the account will be automatically reactivated.
- [ ] On clicking any change button, user will be asked the new mobile number or email.
- [ ] A input and verification prompt similar to the one during sign up will be shown.
- [ ] Once verified, the new mobile number or email will be updated and the user will be redirected to the "Account" tab.
- [ ] "Profile" tab will list all the profiles created by the user.
- [ ] User can click on a profile to view or edit it. This will take them to the "Update Profile" page.
- [ ] A page similar to the "Create Profile" page will be shown with the fields pre-filled. Two additional buttons will be shown: "Update Profile" and "Delete Profile".
- [ ] Deleting a profile will show a confirmation dialog. On confirmation, the profile will be deactived for 30 days and then permanently deleted. User will be now given the option to "Enable Profile" for that profile for 30 days.
- [ ] For "Tenant" profiles, a second page will be shown with the "Tenant Preferences" fields pre-filled.
- [ ] User can edit the fields and click "Update Profile" to save the changes.
- [ ] User will be redirected to the "Profile" tab with the updated profile.

## Page 8: Room Details (Tenant)

## Page 9: Room Details (Provider)

## Page 10: Room Booking Details (Tenant)

## Page 11: Room Booking Details (Provider)
