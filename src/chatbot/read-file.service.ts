import { Injectable, BadRequestException } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as xml2js from 'xml2js';
import * as dayjs from 'dayjs';

@Injectable()
export class ReadFileService {
  private driveClient: drive_v3.Drive;

  constructor() {
    this.driveClient = this.createDriveClient();
  }

  private createDriveClient(): drive_v3.Drive {
    const auth = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI,
    );
    auth.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    return google.drive({ version: 'v3', auth });
  }

  async listFileInFolder(folderId: string): Promise<drive_v3.Schema$File> {
    try {
      const response = await this.driveClient.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id, name)',
      });
      const date = new Date();
      const file = response?.data?.files?.find((file) =>
        file.name.includes(`${dayjs(date).format('YYYYMMDD')}`),
      );
      return file ? file : null;
    } catch (error) {
      throw new BadRequestException('Failed to list file');
    }
  }

  async readFileFromDrive(fileId: string) {
    try {
      const response = await this.driveClient.files.get(
        { fileId, alt: 'media' },
        { responseType: 'json' },
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to read file from Drive');
    }
  }

  async parseXml(xmlData: any) {
    try {
      return new Promise((resolve, reject) => {
        xml2js.parseString(xmlData, (err: any, result: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.log('error', error);
    }
  }

  async readFileInFolder(folderId: string) {
    const file = await this.listFileInFolder(folderId);
    if (!file) throw new BadRequestException('Không có file nào được tìm thấy');
    const content = await this.readFileFromDrive(file.id);
    return content;
  }

  async convertFileToJson() {
    const dataXML = await this.readFileInFolder(process.env.FOLDER_ID);
    return await this.parseXml(dataXML);
  }
}
