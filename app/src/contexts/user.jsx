/** USER is the base Context, used by all other contexts */

import React, { createContext, useCallback, useState } from "react";
import { FirebaseAuth } from "@/modules/firebase/init.js";
import { isEmpty } from "@/modules/util/validations.js";
import { lang } from "@/modules/util/language.js";

/* -------------------------------------- UTIL CLASSES -------------------------------------- */

/**
 * @class
 */
export class UploadedImage {
  /**
   * @param {string} filename
   * @param {string} smallImageURL
   * @param {string} mediumImageURL
   * @param {string} largeImageURL
   * @param {boolean} isPrivate
   */
  constructor(filename, smallImageURL, mediumImageURL, largeImageURL, isPrivate) {
    this.filename = filename;
    this.small = smallImageURL;
    this.medium = mediumImageURL;
    this.large = largeImageURL;
    this.isPrivate = isPrivate;
  }

  /**
   * @param {string} filename
   * @param {any} data
   * @returns {UploadedImage}
   * @param {boolean} isPrivate
   */
  static from(filename, data, isPrivate) {
    if (!data) {
      throw new Error(lang("Invalid UploadedImage data", "অবৈধ আপলোড করা ছবি ডেটা", "अवैध अपलोड की गई छवि डेटा"));
    }
    return new UploadedImage(filename, data.small, data.medium, data.large, isPrivate);
  }

  /** @returns {UploadedImage} */
  clone() {
    return new UploadedImage(this.filename, this.small, this.medium, this.large, this.isPrivate);
  }

  makePrivate() {
    this.isPrivate = true;
    return this;
  }

  makePublic() {
    this.isPrivate = false;
    return this;
  }

  /** @enum {30 | 90 | 500} */
  static Sizes = {
    SMALL: /**  @type {30}  */ (30),
    MEDIUM: /** @type {90}  */ (90),
    LARGE: /**  @type {500} */ (500),
  };

  toString() {
    return JSON.stringify({
      filename: this.filename,
      small: this.small,
      medium: this.medium,
      large: this.large,
      isPrivate: this.isPrivate,
    });
  }
}

/**
 * @class
 */
export class User {
  /** @type {string} */
  uid;

  /** @type {string} */
  email;

  /** @type {string} */
  mobile;

  /** @type {string} */
  firstName;

  /** @type {string} */
  lastName;

  /** @type {UploadedImage | null} */
  profilePhotos;

  /** @type {{ workId?: UploadedImage, govId?: UploadedImage } | null} */
  identityPhotos;

  /** @type {"EMPTY" | "TENANT" | "OWNER"} */
  type;

  /**
   * The type is set to "EMPTY" by default.
   * Type is not included in the constructor because it is not available in Firebase Auth User object.
   * It is to be set using the setType method after the user details are fetched from the database.
   *
   * The profilePhotos is set to null by default.
   * PhotoURLs is not included in the constructor because multiple photo sizes are not available in
   * Firebase Auth User object. It is to be set using the setPhotoURL method after the user details
   * are fetched from the database.
   *
   * @param {string} uid
   * @param {string} email
   * @param {string} mobile
   * @param {string} firstName
   * @param {string} lastName
   */
  constructor(uid, email = "", mobile = "", firstName = "", lastName = "") {
    this.uid = uid;
    this.email = email;
    this.mobile = mobile;
    this.firstName = firstName;
    this.lastName = lastName;
    this.profilePhotos = null;
    this.identityPhotos = null;
    this.type = "EMPTY";
  }

  /**
   * @returns {User}
   */
  static empty() {
    return new User("", "");
  }

  /**
   * Extracts user details from Firebase Auth User object.
   * @param {import("firebase/auth").User} user
   * @returns {User}
   */
  static fromFirebaseAuthUser(user) {
    return new User(user.uid, user.email || "");
  }

  /**
   * Loads the current user from Firebase Auth.
   * @returns {User}
   */
  static loadCurrentUser() {
    const authUser = FirebaseAuth.currentUser;
    if (!authUser) return User.empty();
    return User.fromFirebaseAuthUser(authUser);
  }

  /**
   * @returns {boolean}
   */
  isNotEmpty() {
    return this.uid !== "";
  }

  /**
   * @returns {User}
   */
  clone() {
    const user = new User(this.uid, this.email, this.mobile, this.firstName, this.lastName);

    if (!isEmpty(this.type)) user.setType(/** @type {"TENANT" | "OWNER"} */ (this.type));

    if (this.profilePhotos) user.setProfilePhotos(this.profilePhotos.clone());
    if (this.identityPhotos)
      user.setIdentityPhotos({
        workId: this.identityPhotos.workId?.clone(),
        govId: this.identityPhotos.govId?.clone(),
      });

    return user;
  }

  /**
   * Type does not exist on Firebase Auth User object.
   * Therefore, it is not included in the constructor.
   * @param {"TENANT" | "OWNER"} type
   * @returns {this}
   */
  setType(type) {
    this.type = type;
    return this;
  }

  /**
   * @param {UploadedImage} images
   * @returns {this}
   */
  setProfilePhotos(images) {
    this.profilePhotos = images;
    return this;
  }

  /**
   * @param {{ workId?: UploadedImage, govId?: UploadedImage }} images
   * @returns {this}
   */
  setIdentityPhotos(images) {
    if (!images.workId && !images.govId)
      throw new Error(
        lang(
          "At least one identity photo is required",
          "কমপক্ষে একটি পরিচয় ছবি প্রয়োজন",
          "कम से कम एक पहचान फोटो आवश्यक है"
        )
      );

    this.identityPhotos = {
      workId: images.workId ?? this.identityPhotos?.workId,
      govId: images.govId ?? this.identityPhotos?.govId,
    };
    return this;
  }

  /**
   * @param {string?} firstName
   * @param {string?} lastName
   * @returns {this}
   */
  setProfileName(firstName, lastName) {
    if (typeof firstName === "string") this.firstName = firstName;
    if (typeof lastName === "string") this.lastName = lastName;
    return this;
  }

  /**
   * @param {string} email
   * @returns {this}
   */
  setEmail(email) {
    this.email = email;
    return this;
  }

  /**
   * @param {string} mobile
   * @returns {this}
   */
  setMobile(mobile) {
    this.mobile = mobile;
    return this;
  }

  /**
   * @returns {string}
   */
  toString() {
    return JSON.stringify(
      {
        uid: this.uid,
        type: this.type,
        mobile: this.mobile,
        firstName: this.firstName,
        lastName: this.lastName,
        profilePhotos: this.profilePhotos?.toString(),
        identityPhotos: {
          workId: this.identityPhotos?.workId?.toString(),
          govId: this.identityPhotos?.govId?.toString(),
        },
      },
      null,
      2
    );
  }
}

/* ---------------------------------- USER CONTEXT OBJECT ----------------------------------- */

/**
 * @typedef {{
 *     from?: User,
 *     fromFirebaseAuth?: import("firebase/auth").User
 *     type?: "TENANT" | "OWNER"
 *     email?: string,
 *     mobile?: string,
 *     firstName?: string,
 *     lastName?: string,
 *     profilePhotos?: UploadedImage,
 *     identityPhotos?: { workId?: UploadedImage, govId?: UploadedImage },
 *   }
 * } DispatchUserActions
 */

/**
 * @typedef  {Object} UserContextType
 * @property {User} user
 * @property {(action: DispatchUserActions | "LOADCURRENT" | "RESET") => void} dispatchUser
 */
const UserContext = createContext(
  /** @type {UserContextType} */ ({
    user: User.empty(),
    dispatchUser: () => {},
  })
);

export default UserContext;

/* ------------------------------------ USER PROVIDER COMPONENT ----------------------------------- */

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(User.loadCurrentUser());

  const dispatchUser = useCallback(
    /**
     * @param {DispatchUserActions | "LOADCURRENT" | "RESET"} action
     */
    (action) =>
      setUser((oldUser) => {
        if (!action) return oldUser;
        else if (action === "LOADCURRENT") return User.loadCurrentUser();
        else if (action === "RESET") return User.empty();
        else if (action.from) return action.from;
        else if (action.fromFirebaseAuth) return User.fromFirebaseAuthUser(action.fromFirebaseAuth);

        const newUser = oldUser.clone();

        if (action.type) {
          newUser.setType(action.type);
        }
        if (action.email) {
          newUser.setEmail(action.email);
        }
        if (action.mobile) {
          newUser.setMobile(action.mobile);
        }
        if (action.firstName) {
          newUser.setProfileName(action.firstName, null);
        }
        if (action.lastName) {
          newUser.setProfileName(null, action.lastName);
        }
        if (action.profilePhotos) {
          newUser.setProfilePhotos(action.profilePhotos);
        }
        if (action.identityPhotos?.workId) {
          const identityPhotos = action.identityPhotos;
          newUser.setIdentityPhotos({ workId: identityPhotos.workId });
        }
        if (action.identityPhotos?.govId) {
          const identityPhotos = action.identityPhotos;
          newUser.setIdentityPhotos({ govId: identityPhotos.govId });
        }

        return newUser;
      }),
    [setUser]
  );

  return (
    <UserContext.Provider
      value={{
        user,
        dispatchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
