import { Injectable, BadRequestException } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as xml2js from 'xml2js';
import axios from 'axios';
import * as dayjs from 'dayjs';
import * as moment from 'moment';

@Injectable()
export class UploadService {
  private driveClient: drive_v3.Drive;

  constructor() {
    const auth = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI,
    );
    auth.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    this.driveClient = google.drive({ version: 'v3', auth });
  }

  async readFileInFolder(folderId: string) {
    const file = await this.listFileInFolder(folderId);
    if (!file) throw new BadRequestException('Không có file nào được tìm thấy');
    const content = await this.readFileFromDrive(file.id);
    const jsonData = await this.parseXml(content);
    const messages = this.createMessageFromJson(jsonData);
    await this.sendNotifyToTelegram(messages);
    return {
      msg: 'thành công',
    };
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
    return new Promise((resolve, reject) => {
      const parser = new xml2js.Parser();
      parser.parseString(xmlData, (err: any, result: any) => {
        if (err) {
          console.log(result);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  createMessageFromJson(jsonDataArray: any) {
    const messages: string[] = [];
    const rows = jsonDataArray?.Workbook?.Worksheet?.[0]?.Table?.[0]?.Row || [];
    const filterRow = rows.slice(3);
    for (const row of filterRow) {
      const employeeName = row?.Cell?.[1]?.Data?.[0]?._;
      const checkDate = dayjs('1899-12-30')
        .add(parseInt(row?.Cell?.[4]?.Data?.[0]?._), 'day')
        .format('DD/MM/YYYY');
      const checkDays = row?.Cell?.[5]?.Data?.[0]?._;
      const checkIn = row?.Cell?.[6]?.Data?.[0]?._;
      const checkOut = row?.Cell?.[7]?.Data?.[0]?._;
      if (
        row &&
        row.Cell.length > 1 &&
        moment(checkIn, 'HH:mm').isAfter(moment('09:30', 'HH:mm'))
      ) {
        messages.push(
          `[${checkDate}] ${employeeName} ngày thứ ${checkDays} đi muộn vào lúc ${checkIn}\n`,
        );
      } else if (
        row &&
        row.Cell.length > 1 &&
        employeeName &&
        checkIn === undefined &&
        checkOut === undefined
      ) {
        messages.push(
          `[${checkDate}] ${employeeName} ngày thứ ${checkDays} chưa chấm công\n`,
        );
      } else if (
        row &&
        row.Cell.length > 1 &&
        employeeName &&
        checkIn === undefined &&
        checkOut !== undefined
      ) {
        messages.push(
          `[${checkDate}] ${employeeName} ngày thứ ${checkDays} chưa chấm công vào\n`,
        );
      } else if (
        row &&
        row.Cell.length > 1 &&
        employeeName &&
        checkOut === undefined &&
        checkIn !== undefined
      ) {
        messages.push(
          `[${checkDate}] ${employeeName} ngày thứ ${checkDays} chưa chấm công ra\n`,
        );
      } else {
        // console.log('lỗi', employeeName);
      }
    }
    return messages;
  }

  async sendNotifyToTelegram(message: string[]) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message.join(''),
    };
    try {
      await axios.post(url, payload);
    } catch (error) {
      throw new BadRequestException('Lỗi khi gửi thông báo');
    }
  }
}
