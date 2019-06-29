import * as bcrypt from 'bcrypt-nodejs';
import {Schema} from 'mongoose';


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

export {UserSchema};
