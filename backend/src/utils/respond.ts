import { NextApiResponse } from "next";
import { NetworkType, ADataTransferObj } from "sharedtypes";

export function respond(res: NextApiResponse, result: { status: number; message: string }): void;
export function respond(res: NextApiResponse, result: { status: number; error: string }): void;
export function respond(res: NextApiResponse, result: { status: number; json: NetworkType }): void;

export function respond<T extends ADataTransferObj>(res: NextApiResponse, result: { status: number; dto: T }): void;

// Implementation
export function respond<T extends ADataTransferObj>(
  res: NextApiResponse,
  result: {
    status: number;
    message?: string;
    error?: string;
    json?: NetworkType;
    dto?: T | T[];
  }
): void {
  if (result.dto != null) {
    // Use the static toJson method from the DTO class
    if (Array.isArray(result.dto)) {
      const jsonData = result.dto.map((dto) => dto.toJSON());
      res.status(result.status).json(jsonData);
    } else {
      const jsonData = result.dto.toJSON();
      res.status(result.status).json(jsonData);
    }
  } else if (result.json != null) {
    res.status(result.status).json(result.json);
  } else {
    res.status(result.status).json({
      status: result.status,
      message: result.message ?? result.error ?? "Unknown error occurred",
    });
  }
  res.end();
}
