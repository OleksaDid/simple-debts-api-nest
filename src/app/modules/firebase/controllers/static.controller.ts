import {Controller, Get, Param, Res} from '@nestjs/common';
import {ApiUseTags, ApiResponse} from '@nestjs/swagger';
import {IMAGES_FOLDER_DIR} from '../../../common/constants/constants';
import {Response} from 'express';
import {StorageService} from '../services/storage.service';

@ApiUseTags('static')
@Controller('static')
export class StaticController {


  constructor(
    private _storageService: StorageService
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
    const buffer = await this._storageService.getStaticFile(`${IMAGES_FOLDER_DIR}/${filename}`);
    return res.send(buffer);
  }
}
