import { FirebaseAuth } from "@/modules/firebase/init";
import {
  IdentityGetResBodyWithAuthDTO,
  IdentityPhotosDTO,
  IdentityType,
  MultiSizePhotoDTO,
  Nullable,
} from "sharedtypes";
import { instanceToPlain } from "class-transformer";

type SetterParams = Partial<{
  uid: string;
  email: string;
  type: IdentityType;
  mobile: string;
  firstName: string;
  lastName: string;
  profilePhotos: MultiSizePhotoDTO;
  identityPhotos: IdentityPhotosDTO;
  identity: IdentityGetResBodyWithAuthDTO;
}>;

interface ConstructorParams {
  uid: string;
  email: string;
  idDTO?: IdentityGetResBodyWithAuthDTO;
}

export default class IdentityWrapper {
  uid: string;
  email: string;

  private identity?: IdentityGetResBodyWithAuthDTO;

  /**
   * The type is set to "EMPTY" by default.
   * Type is not included in the constructor because it is not available in Firebase Auth User object.
   * It is to be set using the setType method after the user details are fetched from the database.
   * The profilePhotos is set to null by default.
   * PhotoURLs is not included in the constructor because multiple photo sizes are not available in
   * Firebase Auth User object. It is to be set using the setPhotoURL method after the user details
   * are fetched from the database.
   */
  constructor(params: ConstructorParams) {
    const { uid, email, idDTO } = params;
    this.uid = uid;
    this.email = email;
    if (idDTO != null) {
      this.identity = idDTO;
    }
  }

  get<K extends keyof SetterParams>(name: K): Nullable<SetterParams[K]> {
    switch (name) {
      case "uid":
        return this.uid as never;
      case "email":
        return this.email as never;
      case "identity":
        return this.identity as never;
      case "type":
        return this.identity?.type as never;
      case "firstName":
        return this.identity?.firstName as never;
      case "lastName":
        return this.identity?.lastName as never;
      case "mobile":
        return this.identity?.mobile as never;
      case "profilePhotos":
        return this.identity?.profilePhotos as never;
      case "identityPhotos":
        return this.identity?.identityPhotos as never;
      default:
        return null;
    }
  }

  /**
   * @throws {Error}
   */
  set<K extends keyof SetterParams>(name: K, value: NonNullable<SetterParams[K]>): this {
    if (this.identity == null) {
      // when identity is null and someone wants to set something that's a prop of identity, fail
      if (!["uid", "email", "identity"].includes(name)) {
        throw new Error("User yet to be populated from Firebase");
      }
    }
    switch (name) {
      case "uid":
        this.uid = value as never;
        break;
      case "email":
        this.email = value as never;
        break;
      case "identity":
        this.identity = value as never;
        break;
      case "type":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.identity!.type = value as never;
        break;
      case "firstName":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.identity!.firstName = value as never;
        break;
      case "lastName":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.identity!.lastName = value as never;
        break;
      case "mobile":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.identity!.mobile = value as never;
        break;
      case "profilePhotos":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.identity!.profilePhotos = value as never;
        break;
      case "identityPhotos":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.identity!.identityPhotos = value as never;
        break;
    }
    return this;
  }

  /**
   * @throws {Error}
   */
  unset<K extends keyof Omit<SetterParams, "uid" | "email">>(name: K): this {
    if (this.identity == null) {
      // when identity is null and someone wants to unset something that's a prop of identity or identity itself, fail
      if (!["uid", "email"].includes(name)) {
        throw new Error("User yet to be populated from Firebase");
      }
    }
    switch (name) {
      case "identity":
        delete this.identity;
        break;
      case "type":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        delete this.identity!.type;
        break;
      case "firstName":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        delete this.identity!.firstName;
        break;
      case "lastName":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        delete this.identity!.lastName;
        break;
      case "mobile":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        delete this.identity!.mobile;
        break;
      case "profilePhotos":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        delete this.identity!.profilePhotos;
        break;
      case "identityPhotos":
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        delete this.identity!.identityPhotos;
        break;
    }
    return this;
  }

  /**
   * Extracts user details from Firebase Auth User object.
   */
  static fromFirebaseAuthUser(user: import("firebase/auth").User): Nullable<IdentityWrapper> {
    if (user.email != null) return new IdentityWrapper({ uid: user.uid, email: user.email });
    else return null;
  }

  /**
   * Loads the current user from Firebase Auth.
   */
  static loadCurrentUser(): Nullable<IdentityWrapper> {
    return FirebaseAuth.currentUser != null ? IdentityWrapper.fromFirebaseAuthUser(FirebaseAuth.currentUser) : null;
  }

  static invalid(): IdentityWrapper {
    return new IdentityWrapper({ uid: "", email: "" });
  }

  isInvalid(): boolean {
    return this.uid === "";
  }

  /**
   * @throws {DtoValidationError}
   */
  clone(): IdentityWrapper {
    const params: ConstructorParams = { uid: this.uid, email: this.email };
    if (this.identity != null) {
      // Throw error coz there's no error handler at this level
      params.idDTO = IdentityGetResBodyWithAuthDTO.create(this.identity).unwrapOrThrow();
    }
    const user = new IdentityWrapper(params);
    return user;
  }

  toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  toJSON(): object {
    return instanceToPlain(this);
  }
}
