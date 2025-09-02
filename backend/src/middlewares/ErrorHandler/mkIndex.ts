import { extractIndexData, parseDataIntoIndexSpec, createFirestoreIndex } from "@/firebase";

export interface FirebaseIndexError extends Error {
  code: number;
  details: string;
}

export type IndexBuildErrorStatus = "BUILD_INITIATED" | "BUILD_IN_PROGRESS" | "NOT_INDEX_ERROR";

const INDEX_BUILD_IN_PROGRESS = "The query requires an index. That index is currently building and cannot be used yet.";
const INDEX_INTIATE_BUILD = "The query requires an index. You can create it here:";

export function isFirebaseIndexError(e: unknown): e is FirebaseIndexError {
  const state = getFirebaseIndexErrorState(e);
  switch (state) {
    case "BUILD_IN_PROGRESS":
    case "BUILD_INITIATED":
      return true;
    case "NOT_INDEX_ERROR":
      return false;
  }
}

function getFirebaseIndexErrorState(e: unknown): IndexBuildErrorStatus {
  const instanceofError = e instanceof Error;

  if (instanceofError) {
    const maybeIndexError = e as FirebaseIndexError;

    const codeAndDetailsPresent =
      typeof maybeIndexError.code === "number" && typeof maybeIndexError.details === "string";

    if (codeAndDetailsPresent) {
      const codeIs6or9 = maybeIndexError.code === 6 || maybeIndexError.code === 9;

      if (codeIs6or9) {
        const detailsIncludeLink = maybeIndexError.details.includes(INDEX_INTIATE_BUILD);
        const detailsIncludeIndexBeingBuilt = maybeIndexError.details.includes(INDEX_BUILD_IN_PROGRESS);

        if (detailsIncludeLink) return "BUILD_INITIATED";
        else if (detailsIncludeIndexBeingBuilt) return "BUILD_IN_PROGRESS";
      }
    }
  }

  return "NOT_INDEX_ERROR";
}

/**
 * Handles Firebase errors by automatically creating missing indexes when possible or simply returning if index creation already in process.
 * @param error - The error object from Firebase
 * @returns Promise that resolves to true if error was handled by creating an index, false if error was not due to missing index or otherwise
 * @throws Error if index creation fails or if the index already exists
 */
export async function handleFbIdxErrOrBuildIdx(error: FirebaseIndexError): Promise<IndexBuildErrorStatus> {
  // Check if this is an index-related error (code 9 with specific details)
  if (getFirebaseIndexErrorState(error) === "BUILD_IN_PROGRESS") {
    return "BUILD_IN_PROGRESS";
  }
  if (getFirebaseIndexErrorState(error) === "NOT_INDEX_ERROR") {
    // Not an index-related error, just return
    return "NOT_INDEX_ERROR";
  }
  // otherwise, index to be build, so start the process
  // Extract the index creation URL from the error
  const indexDataString = extractIndexData(error.details);
  // eslint-disable-next-line no-useless-catch
  try {
    // Parse the index specification from the URL
    const { projectId, databaseId, spec: indexSpec } = parseDataIntoIndexSpec(indexDataString);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (!indexSpec) {
      throw new Error("Could not parse index specification from URL");
    }
    // Create the index using Firebase Admin SDK
    await createFirestoreIndex(projectId, databaseId, indexSpec);
    console.log(`[I] [HandleFirebaseIndexError] Successfully created index for key: ${indexDataString}`);
  } catch (indexError) {
    // Rethrow with more specific error
    throw indexError;
  }
  return "BUILD_INITIATED";
}
