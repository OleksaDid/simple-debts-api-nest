import {Request} from "express";

export class ImagesHelper {

    static getImagesPath(req: Request): string {
      return req.protocol + '://' + req.get('host') + '/images/';
    }

    static generateFbImagePath(profileId): string {
        return `https://graph.facebook.com/${profileId}/picture?type=large`;
    }

}