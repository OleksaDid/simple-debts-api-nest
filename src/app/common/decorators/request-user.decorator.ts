import {createRouteParamDecorator} from '@nestjs/common';

export const ReqUser = createRouteParamDecorator((data, req) => {
    return req.user;
});