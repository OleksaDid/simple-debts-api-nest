import * as bcrypt from 'bcrypt-nodejs';
import * as fs from 'fs';
import * as Identicon from 'identicon.js';
import {Schema} from 'mongoose';
import {IMAGES_FOLDER_DIR} from "../../common/constants/constants";


const UserSchema = new Schema({
    email: { type: String, index: true, unique: true, sparse: true },
    name: String,
    picture: String,
    password: String,

    virtual: {type: Boolean, default: false},

    facebook: { type: String, index: true, unique: true, sparse: true },

    refreshTokenId: Number,
    accessTokenId: Number,

}, { timestamps: true });

// generating a hash
UserSchema.methods.generateHash = (password: string) => bcrypt.hashSync(password, bcrypt.genSaltSync(8));

// checking if password is valid
UserSchema.methods.validPassword = function(password: string) {
    return bcrypt.compareSync(password, this.password);
};

// create picture, save it in public folder & return public link
UserSchema.methods.generateIdenticon = (hashSubject) => {
    const identiconOptions = {
        background: [255, 255, 255, 255],         // rgba white
        margin: 0.2,                              // 20% margin
        size: 200
    };
    const imgBase64 = new Identicon(hashSubject, identiconOptions).toString();
    const fileName = hashSubject + '.png';

    return new Promise((resolve, reject) => {
        fs.writeFile(
            IMAGES_FOLDER_DIR + '/' + fileName,
            new Buffer(imgBase64, 'base64'),
            err => {
                if (err) reject(err);
                else resolve(fileName);
            });
    });
};

export default UserSchema;