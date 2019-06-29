export class ImagesHelper {

    static generateFbImagePath(profileId): string {
        return `https://graph.facebook.com/${profileId}/picture?type=large`;
    }

}
