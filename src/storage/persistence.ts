/**
 * Asks the browser to keep this app's data instead of clearing it when space runs low.
 * Browsers without this feature are simply skipped; a refusal changes nothing for now.
 */
export async function requestPersistentStorage(
  storageManager: Pick<StorageManager, "persist"> | undefined,
): Promise<boolean> {
  if (storageManager === undefined || typeof storageManager.persist !== "function") return false;
  try {
    return await storageManager.persist();
  } catch {
    return false;
  }
}
