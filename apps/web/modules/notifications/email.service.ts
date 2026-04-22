/** Thin facade — transactional sends use `notify.ts` (Resend); SMS uses Twilio in `sms.service`. */
export { sendTransactionalEmail } from "./notify";
export { sendEmail } from "@/lib/email/resend";
export { sendSmsViaTwilio as sendSms } from "./sms.service";
