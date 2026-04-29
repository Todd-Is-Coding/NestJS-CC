import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { EXCEPTION_FILTERS_METADATA } from '@nestjs/common/constants';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const res = await this.paymentsRepo.save(createPaymentDto);
    return res;
  }

  async findAll() {
    const res = await this.paymentsRepo.find();
    return res;
  }

  async findOne(id: number) {
    const res = await this.paymentsRepo.findOneBy({ id });
    return res;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const existingPayment = await this.paymentsRepo.findOneBy({ id: id });
    if (existingPayment) {
      existingPayment.currency = updatePaymentDto.currency;
    }
    const updatedPayment = await this.paymentsRepo.save(existingPayment);
    return updatedPayment;
  }

  async remove(id: number) {
    return await this.paymentsRepo.delete(id)
  }
}
