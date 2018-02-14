import {MS_IN_S} from "../constants/constants";

export class DateHelper {

    static getNowDateInSeconds(): number {
        const nowDateInSeconds = Date.now() / MS_IN_S;

        return Math.floor(nowDateInSeconds);
    }

}