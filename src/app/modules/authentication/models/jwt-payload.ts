import {Id} from "../../../common/types/types";
import {ACCESS_TOKEN_EXP_SECONDS, REFRESH_TOKEN_EXP_SECONDS} from "../../../common/constants/constants";
import {DateHelper} from "../../../common/classes/date-helper";

export class JwtPayload {
    id: Id;
    exp: number;
    readonly jwtid = Math.ceil(Math.random() * 10000);

    constructor(id: Id, expirationTimeInSeconds: number) {
        this.id = id;
        this.exp = DateHelper.getNowDateInSeconds() + expirationTimeInSeconds;
    }
}


export class RefreshJwtPayload extends JwtPayload {
    constructor(userId: Id) {
        super(userId, REFRESH_TOKEN_EXP_SECONDS);
    }
}

export class AccessJwtPayload extends JwtPayload {
    constructor(userId: Id) {
        super(userId, ACCESS_TOKEN_EXP_SECONDS);
    }
}
