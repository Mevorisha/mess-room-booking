import { QuerySortOrder } from "sharedtypes";
import { CollectionReference, Query, WhereFilterOp } from "firebase-admin/firestore";

type FirestoreField<T> = Extract<keyof T, string>;

export class QueryWrapper<T> {
  private query: Query<T>;

  private constructor(ref: CollectionReference) {
    this.query = ref as unknown as Query<T>;
  }

  static create<U>(ref: CollectionReference): QueryWrapper<U> {
    return new QueryWrapper<U>(ref);
  }

  where<K extends FirestoreField<T>>(field: K, op: WhereFilterOp, value: T[K] | T[K][]): QueryWrapper<T> {
    this.query = this.query.where(field, op, value);
    return this;
  }

  // prettier-ignore
  orderBy<K extends FirestoreField<T>>(field: K, direction: QuerySortOrder = QuerySortOrder.ASCENDING): QueryWrapper<T> {
    this.query = this.query.orderBy(field, direction === QuerySortOrder.ASCENDING ? "asc" : "desc");
    return this;
  }

  getQuery(): Query<T> {
    return this.query;
  }
}
