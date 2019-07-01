import {Controller, Get, Param, Res} from '@nestjs/common';
import {ApiUseTags, ApiResponse} from '@nestjs/swagger';
import {FirebaseService} from '../services/firebase.service';
import {IMAGES_FOLDER_DIR} from '../../../common/constants/constants';
import {Response} from 'express';

@ApiUseTags('static')
@Controller('static')
export class StaticController {


  constructor(
    private _firebaseService: FirebaseService
  ) {}


  @ApiResponse({
    status: 200,
    description: 'file'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request'
  })
  @Get(`/${IMAGES_FOLDER_DIR}/:filename`)
  async getImage(
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    const buffer = await this._firebaseService.getStaticFile(`${IMAGES_FOLDER_DIR}/${filename}`);
    return res.send(buffer);
  }
}
