import NetworkType from "@/types/NetworkType";
import { ClassConstructor, instanceToPlain, plainToInstance } from "class-transformer";

export default abstract class ADataTransferObj {
  static toJson<T extends ADataTransferObj>(dto: T): NetworkType {
    return instanceToPlain(dto);
  }
  static fromJson<T extends ADataTransferObj>(cls: ClassConstructor<T>, json: NetworkType): T {
    return plainToInstance(cls, json);
  }
}
