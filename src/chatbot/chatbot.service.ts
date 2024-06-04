import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dayjs from 'dayjs';
import * as moment from 'moment';
import { ReadFileService } from './read-file.service';

@Injectable()
export class ChatbotService {
  constructor(private readonly readfileService: ReadFileService) {}
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

  async sendNotifyToTelegram() {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const jsonData = await this.readfileService.convertFileToJson();
    const message = this.createMessageFromJson(jsonData).join('');
    const payload = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
    };
    try {
      await axios.post(url, payload);
      return 'Gửi thông báo thành công';
    } catch (error) {
      // console.log(error);
      throw new BadRequestException('Lỗi khi gửi thông báo');
    }
  }
}
