export default class RoomSearchService {
  static filterByTags(
    docs: FirebaseFirestore.QueryDocumentSnapshot[],
    searchTags: Set<string>
  ): { data: RoomData; sortPriority: number; docId: string }[] {
    const results: { data: RoomData; sortPriority: number; docId: string }[] = [];

    for (const doc of docs) {
      const roomData = doc.data() as RoomData;

      if (searchTags.size > 0) {
        const tagResult = this.getTagMatchPriority(roomData, searchTags);
        if (!tagResult.hasMatch) continue;

        results.push({
          data: roomData,
          sortPriority: tagResult.priority,
          docId: doc.id,
        });
      } else {
        results.push({
          data: roomData,
          sortPriority: 0,
          docId: doc.id,
        });
      }
    }

    return results;
  }

  private static getTagMatchPriority(roomData: RoomData, searchTags: Set<string>) {
    // Tag matching logic here
  }
}
