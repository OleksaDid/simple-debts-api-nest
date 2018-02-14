interface LocalAuthentication {
    readonly email: string;
    readonly password: string;
}

export class LoginLocalDto implements LocalAuthentication {
    readonly email: string;
    readonly password: string;
}

export class SignUpLocalDto implements LocalAuthentication {
    readonly email: string;
    readonly password: string;
}