import { extractIndexData, parseDataIntoIndexSpec, createFirestoreIndex } from "@/lib/firebaseAdmin";

/**
 * Handles Firebase errors by automatically creating missing indexes when possible
 * @param error - The error object from Firebase
 * @returns Promise that resolves to true if error was handled by creating an index, false if error was not due to missing index or otherwise
 * @throws Error if index creation fails or if the index already exists
 */
export async function handleFirebaseIndexError(error: { code: number; details: string }): Promise<boolean> {
  // Check if this is an index-related error (code 9 with specific details)
  if (
    error.code === 9 &&
    error.details &&
    typeof error.details === "string" &&
    error.details.includes("The query requires an index. That index is currently building and cannot be used yet.")
  ) {
    return true; // Index is being built, return true
  }
  if (
    error.code !== 9 ||
    !error.details ||
    typeof error.details !== "string" ||
    !error.details.includes("The query requires an index. You can create it here:")
  ) {
    // Not an index-related error, just return false
    return false;
  }
  // Extract the index creation URL from the error
  const indexDataString = extractIndexData(error.details);
  try {
    // Parse the index specification from the URL
    const { projectId, databaseId, spec: indexSpec } = parseDataIntoIndexSpec(indexDataString);
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
  // Keep tracking key to mark as created
  return true;
}
