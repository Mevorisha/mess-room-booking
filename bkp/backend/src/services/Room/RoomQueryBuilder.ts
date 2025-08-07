import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import { SchemaFields } from "@/models/Room";

export default class RoomQueryBuilder {
  private query: FirebaseFirestore.Query;

  constructor() {
    this.query = FirebaseFirestore.collection(FirestorePaths.ROOMS);
  }

  whereOwner(ownerId: string): this {
    this.query = this.query.where(SchemaFields.OWNER_ID, "==", ownerId);
    return this;
  }

  whereCity(city: string): this {
    this.query = this.query.where(SchemaFields.CITY, "==", city);
    return this;
  }

  wherePriceRange(low?: number, high?: number): this {
    if (low != null) this.query = this.query.where(SchemaFields.PRICE_PER_OCCUPANT, ">=", low);
    if (high != null) this.query = this.query.where(SchemaFields.PRICE_PER_OCCUPANT, "<=", high);
    return this;
  }

  onlyAvailable(): this {
    this.query = this.query.where(SchemaFields.IS_UNAVAILABLE, "==", false);
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc"): this {
    this.query = this.query.orderBy(field, direction);
    return this;
  }

  build(): FirebaseFirestore.Query {
    return this.query;
  }
}
