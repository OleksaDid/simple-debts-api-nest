import {createRouteParamDecorator} from '@nestjs/common';

export const ReqUser = createRouteParamDecorator((data, req) => req.user);