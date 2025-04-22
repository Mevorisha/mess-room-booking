import * as admin from "firebase-admin";
import * as config from "@/lib/config";
import { CustomApiError } from "../utils/ApiError";

export interface IndexSpec {
  collectionId: string;
  queryScope?: "COLLECTION" | "COLLECTION_GROUP";
  fields: Array<{
    fieldPath: string;
    mode?: "ASCENDING" | "DESCENDING";
  }>;
}

/**
 * Extracts the index specification URL from error details
 * @param errorDetails - The error details string containing the index URL
 * @returns The extracted URL or null if not found
 */
export function extractIndexData(errorDetails: string): string {
  const match = errorDetails.match(
    /You can create it here: (https:\/\/console\.firebase\.google\.com\/v1\/r\/project\/.*\/firestore\/indexes\?create_composite=.*)/
  );
  // extract the URL from the match
  const url = match ? match[1] ?? null : null;
  if (!url) {
    throw new Error("Could not extract index URL from error details");
  }
  // Extract the create_composite parameter from the URL
  const data = new URL(url).searchParams.get("create_composite");
  if (!data) {
    throw new Error("Could not extract index data from URL");
  }
  return data;
}

/**
 * Parses the index specification from the URL
 * @param data - The data string containing the index information
 * @returns Object containing projectId, databaseId, and index specification
 */
export function parseDataIntoIndexSpec(data: string): {
  projectId: string | null;
  databaseId: string | null;
  spec: IndexSpec;
} {
  // Decode from base64
  const buffer = Buffer.from(data, "base64");

  // Convert to string for path extraction
  const asString = buffer.toString();

  // Extract collection path details
  const pathMatch = asString.match(/projects\/([^\/]+)\/databases\/([^\/]+)\/collectionGroups\/([^\/]+)\/indexes/);
  if (!pathMatch) {
    throw new Error("Invalid Firestore index protobuf string format");
  }

  const [, projectId = null, databaseId = null, collectionId = null] = pathMatch;

  // Find field definitions manually by looking for field patterns in the binary data
  const fields: { fieldPath: string; mode?: "ASCENDING" | "DESCENDING" }[] = [];

  // Start after the collection path
  let pos = asString.indexOf("/indexes/") + 9;

  // Loop through the buffer to find field patterns
  while (pos < buffer.length) {
    // Look for field marker (0x1A which is the field tag)
    if (buffer[pos] === 0x1a) {
      pos++; // Move past the tag

      // Get field description length
      const fieldDescLen = buffer[pos] ?? 0;
      pos++;

      if (pos + fieldDescLen <= buffer.length) {
        // Get field name
        // Find 0x0A (start of field name)
        const fieldStartPos = pos;
        let fieldNameStart = -1;
        let fieldNameLen = -1;

        for (let i = 0; i < fieldDescLen; i++) {
          if (buffer[fieldStartPos + i] === 0x0a) {
            fieldNameStart = fieldStartPos + i + 1;
            fieldNameLen = buffer[fieldStartPos + i + 1] ?? 0;
            break;
          }
        }

        if (fieldNameStart >= 0) {
          // Extract field name
          const fieldName = buffer.slice(fieldNameStart + 1, fieldNameStart + 1 + fieldNameLen).toString();

          // Find direction marker (0x10)
          let directionPos = -1;
          for (let i = fieldNameStart + fieldNameLen + 1; i < fieldStartPos + fieldDescLen; i++) {
            if (buffer[i] === 0x10) {
              directionPos = i;
              break;
            }
          }

          if (directionPos >= 0) {
            // Get direction value (1 = ASCENDING, 2 = DESCENDING)
            const direction = buffer[directionPos + 1] === 1 ? "ASCENDING" : "DESCENDING";

            fields.push({
              fieldPath: fieldName,
              mode: direction,
            });
          }
        }

        pos += fieldDescLen; // Move past this field
      } else {
        break; // Not enough data left
      }
    } else {
      pos++; // Skip this byte
    }
  }
  if (fields.length === 0) {
    // Try a fallback method - extract via regex from the visible patterns
    const fieldMatches = asString.matchAll(/\x1A[\s\S]{1,20}([\w_]+)\x10(\x01|\x02)/g);

    for (const match of fieldMatches) {
      if (match[1]) {
        const fieldPath = match[1];
        const mode = match[2] === "\x01" ? "ASCENDING" : "DESCENDING";
        fields.push({ fieldPath, mode });
      }
    }
  }
  if (fields.length === 0) {
    throw new Error("No fields found in protobuf string");
  }
  if (!collectionId) {
    throw new Error("No collection ID found in protobuf string");
  }
  // Create the result object in Firestore API format
  return { projectId, databaseId, spec: { collectionId, queryScope: "COLLECTION", fields } };
}

/**
 * Creates a Firestore index from the parsed specification
 * @param projectId - The Firebase project ID
 * @param databaseId - The Firestore database ID
 * @indexSpec - The index specification object
 * @returns Promise resolving to the created index
 */
export async function createFirestoreIndex(
  projectId: string | null,
  databaseId: string | null,
  indexSpec: IndexSpec
): Promise<any> {
  if (!indexSpec || !indexSpec.collectionId || !indexSpec.fields) {
    throw new Error("Invalid index specification");
  }
  // Create the index using Firebase Admin SDK
  const client = new admin.firestore.v1.FirestoreAdminClient({
    credentials: config.CUSTOM_FIRESTORE_INDEX_ADMIN_SERVICE_ACCOUNT_KEY,
  });
  const parent = client.collectionGroupPath(
    projectId ?? config.FIREBASE_PROJECT_ID,
    databaseId ?? "(default)",
    indexSpec.collectionId
  );
  const request = {
    parent,
    index: {
      collectionGroup: indexSpec.collectionId,
      queryScope: indexSpec.queryScope ?? "COLLECTION",
      fields: indexSpec.fields.map((field) => ({
        fieldPath: field.fieldPath,
        order: field.mode ?? "DESCENDING",
      })),
    },
  };
  return client
    .createIndex(request)
    .then((responses) => {
      const response = responses[0];
      return response;
    })
    .catch((error) => {
      if (error.code === 6 || error.code === 9) {
        console.error(`[E] [CreateFirestoreIndex] Failed to create index: ${error.message}\nOn request: ${JSON.stringify(request, null, 2)}`); // prettier-ignore
        throw CustomApiError.create(500, "Server busy. Please try again later.");
      } else {
        throw new Error(`Failed to create index: ${error}\nOn request: ${JSON.stringify(request, null, 2)}`);
      }
    });
}
