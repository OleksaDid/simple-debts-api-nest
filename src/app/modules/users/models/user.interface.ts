import { Document } from 'mongoose';

export interface UserInterface extends Document {
    email: string;
    name: string;
    picture: string;
    password: string;

    virtual: boolean;

    facebook: string;

    refreshTokenId: number;
    accessTokenId: number;

    generateHash: (password: string) => string;
    validPassword: (password: string) => boolean;
}
