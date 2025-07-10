import { FirebaseAuth } from "@/modules/firebase/init";
import { lang } from "@/modules/util/language";
import UploadedImage from "@/modules/classes/UploadedImage";

export default class User {
  uid: string;
  email: string;
  mobile: string;
  firstName: string;
  lastName: string;
  profilePhotos: UploadedImage | null;
  identityPhotos: { workId?: UploadedImage; govId?: UploadedImage } | null;
  type: "EMPTY" | "TENANT" | "OWNER";

  /**
   * The type is set to "EMPTY" by default.
   * Type is not included in the constructor because it is not available in Firebase Auth User object.
   * It is to be set using the setType method after the user details are fetched from the database.
   * The profilePhotos is set to null by default.
   * PhotoURLs is not included in the constructor because multiple photo sizes are not available in
   * Firebase Auth User object. It is to be set using the setPhotoURL method after the user details
   * are fetched from the database.
   */
  constructor(uid: string, email = "", mobile = "", firstName = "", lastName = "") {
    this.uid = uid;
    this.email = email;
    this.mobile = mobile;
    this.firstName = firstName;
    this.lastName = lastName;
    this.profilePhotos = null;
    this.identityPhotos = null;
    this.type = "EMPTY";
  }

  static empty(): User {
    return new User("", "");
  }

  /**
   * Extracts user details from Firebase Auth User object.
   */
  static fromFirebaseAuthUser(user: import("firebase/auth").User): User {
    return new User(user.uid, user.email ?? "");
  }

  /**
   * Loads the current user from Firebase Auth.
   */
  static loadCurrentUser(): User {
    const authUser = FirebaseAuth.currentUser;
    if (authUser == null) return User.empty();
    return User.fromFirebaseAuthUser(authUser);
  }

  isNotEmpty(): boolean {
    return this.uid !== "";
  }

  clone(): User {
    const user = new User(this.uid, this.email, this.mobile, this.firstName, this.lastName);

    if (this.type != "EMPTY") user.setType(this.type);

    if (this.profilePhotos != null) user.setProfilePhotos(this.profilePhotos.clone());
    if (this.identityPhotos != null) {
      const workId = this.identityPhotos.workId?.clone();
      const govId = this.identityPhotos.govId?.clone();
      if (workId != null && govId != null) {
        user.setIdentityPhotos({ workId, govId });
      } else if (workId == null && govId != null) {
        user.setIdentityPhotos({ govId });
      } else if (workId != null && govId == null) {
        user.setIdentityPhotos({ workId });
      }
    }

    return user;
  }

  /**
   * Type does not exist on Firebase Auth User object.
   * Therefore, it is not included in the constructor.
   * @param {"TENANT" | "OWNER"} type
   * @returns {this}
   */
  setType(type: "TENANT" | "OWNER"): this {
    this.type = type;
    return this;
  }

  /**
   * @param {UploadedImage} images
   * @returns {this}
   */
  setProfilePhotos(images: UploadedImage): this {
    this.profilePhotos = images;
    return this;
  }

  /**
   * @param {{ workId?: UploadedImage, govId?: UploadedImage }} images
   * @returns {this}
   */
  setIdentityPhotos(images: { workId?: UploadedImage; govId?: UploadedImage }): this {
    if (images.workId == null && images.govId == null)
      throw new Error(
        lang(
          "At least one identity photo is required",
          "কমপক্ষে একটি পরিচয় ছবি প্রয়োজন",
          "कम से कम एक पहचान फोटो आवश्यक है"
        )
      );
    const workId = images.workId ?? this.identityPhotos?.workId;
    const govId = images.govId ?? this.identityPhotos?.govId;
    if (workId != null && govId != null) {
      this.identityPhotos = { workId, govId };
    } else if (workId == null && govId != null) {
      this.identityPhotos = { govId };
    } else if (workId != null && govId == null) {
      this.identityPhotos = { workId };
    }
    return this;
  }

  /**
   * @param {string?} firstName
   * @param {string?} lastName
   * @returns {this}
   */
  setProfileName(firstName: string | null, lastName: string | null): this {
    if (typeof firstName === "string") this.firstName = firstName;
    if (typeof lastName === "string") this.lastName = lastName;
    return this;
  }

  /**
   * @param {string} email
   * @returns {this}
   */
  setEmail(email: string): this {
    this.email = email;
    return this;
  }

  /**
   * @param {string} mobile
   * @returns {this}
   */
  setMobile(mobile: string): this {
    this.mobile = mobile;
    return this;
  }

  /**
   * @returns {string}
   */
  toString(): string {
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
