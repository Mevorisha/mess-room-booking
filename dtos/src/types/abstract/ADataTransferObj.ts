import NetworkType from "@/NetworkType";
import { ClassConstructor, instanceToPlain, plainToInstance } from "class-transformer";

export default abstract class ADataTransferObj {
  static toJson<T>(dto: T): NetworkType {
    return instanceToPlain(dto);
  }
  static fromJson<T>(json: NetworkType, cls: ClassConstructor<T>): T {
    return plainToInstance(cls, json);
  }
}
