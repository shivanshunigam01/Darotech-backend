import crypto from 'crypto';
import Payment from '../models/Payment.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, created } from '../utils/ApiResponse.js';
import { paginate } from '../utils/pagination.js';
import { invoicePdfStream } from '../utils/generateInvoice.js';
import {
  resolveRazorpay,
  resolveStripe,
  getRazorpayKeyId,
  getRazorpaySecret,
  getStripePublishableKey,
  getPaymentSettings,
} from '../utils/paymentGateways.js';

export const getConfig = asyncHandler(async (req, res) => {
  const [rz, st, keyId, pubKey, paySettings] = await Promise.all([
    resolveRazorpay(),
    resolveStripe(),
    getRazorpayKeyId(),
    getStripePublishableKey(),
    getPaymentSettings(),
  ]);
  const gateways = ['Manual'];
  if (rz && keyId) gateways.unshift('Razorpay');
  if (st && pubKey) gateways.unshift('Stripe');

  ok(res, {
    razorpayKeyId: keyId,
    stripePublishableKey: pubKey,
    currency: paySettings.currency,
    taxPercentage: paySettings.taxPercentage,
    mode: paySettings.mode,
    gateways,
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  const { amount, customerName, email, phone, service, pkg, gateway = 'Razorpay' } = req.body;
  const paySettings = await getPaymentSettings();
  const invoiceNo = `${paySettings.mode === 'Live' ? '' : 'TEST-'}DT-INV-${Date.now()}`;
  let order = null;
  let resolvedGateway = gateway;

  if (gateway === 'Razorpay') {
    const rz = await resolveRazorpay();
    if (!rz) {
      resolvedGateway = 'Manual';
    } else {
      order = await rz.orders.create({
        amount: Math.round(amount * 100),
        currency: paySettings.currency || 'INR',
        receipt: invoiceNo,
        notes: { service: service || '', package: pkg || '', email },
      });
    }
  } else if (gateway === 'Stripe') {
    const st = await resolveStripe();
    if (!st) {
      resolvedGateway = 'Manual';
    } else {
      order = await st.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: (paySettings.currency || 'INR').toLowerCase(),
        metadata: { invoiceNo, service: service || '', package: pkg || '' },
        receipt_email: email,
      });
    }
  }

  const payment = await Payment.create({
    invoiceNo,
    customerName,
    email,
    phone,
    service,
    package: pkg,
    amount,
    currency: paySettings.currency || 'INR',
    tax: Math.round(amount - amount / (1 + paySettings.taxPercentage / 100)),
    gateway: resolvedGateway,
    gatewayOrderId: order?.id,
    status: 'Pending',
  });

  created(res, { order, payment, gateway: resolvedGateway }, 'Payment order created');
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const secret = await getRazorpaySecret();
  if (!secret) throw new ApiError(500, 'Razorpay not configured');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  if (expected !== razorpay_signature) throw new ApiError(400, 'Invalid payment signature');
  const payment = await Payment.findOneAndUpdate(
    { gatewayOrderId: razorpay_order_id },
    {
      status: 'Paid',
      gatewayPaymentId: razorpay_payment_id,
      transactionId: razorpay_payment_id,
      paymentDate: new Date(),
    },
    { new: true },
  );
  if (!payment) throw new ApiError(404, 'Payment record not found');
  ok(res, payment, 'Payment verified');
});

export const webhook = asyncHandler(async (req, res) => {
  res.json({ received: true });
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, status, gateway, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (gateway) filter.gateway = gateway;
  if (q) {
    filter.$or = [
      { customerName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { invoiceNo: new RegExp(q, 'i') },
    ];
  }
  ok(res, await paginate(Payment, { page, limit, filter }));
});

export const get = asyncHandler(async (req, res) => {
  const item = await Payment.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Payment not found');
  ok(res, item);
});

export const update = asyncHandler(async (req, res) => {
  const item = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) throw new ApiError(404, 'Payment not found');
  ok(res, item, 'Payment updated');
});

export const refund = asyncHandler(async (req, res) => {
  const item = await Payment.findByIdAndUpdate(
    req.params.id,
    { status: 'Refunded', refundId: `manual-${Date.now()}` },
    { new: true },
  );
  if (!item) throw new ApiError(404, 'Payment not found');
  ok(res, item, 'Refund marked');
});

export const invoicePdf = asyncHandler(async (req, res) => {
  const item = await Payment.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Payment not found');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${item.invoiceNo}.pdf`);
  invoicePdfStream(item).pipe(res);
});
