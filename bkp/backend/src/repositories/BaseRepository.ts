import { FirebaseFirestore } from "@/firebase/init";
import { CollectionReference, DocumentReference } from "firebase-admin/firestore";

export default abstract class BaseRepository<T, CreateT, UpdateT> {
  protected collection: string;

  constructor(collection: string) {
    this.collection = collection;
  }

  protected getRef(id: string): DocumentReference {
    return FirebaseFirestore.collection(this.collection).doc(id);
  }

  protected getCollection(): CollectionReference {
    return FirebaseFirestore.collection(this.collection);
  }

  abstract create(data: CreateT): Promise<string>;
  abstract update(id: string, data: UpdateT): Promise<void>;
  abstract get(id: string): Promise<T | null>;
  abstract delete(id: string): Promise<void>;
}
