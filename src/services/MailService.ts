import nodeMailer from "nodemailer";
import dotenv from "dotenv";
import express from "express";
import SMTPTransport, {
    MailOptions,
} from "nodemailer/lib/smtp-transport/index";
import type { SenderDetail } from "../types/MailServiceTypes";
import { responseStatus, responseStatusCode } from "../utils/Utils";

dotenv.config();

let mailPort: NonNullable<string> = process.env.MAIL_PORT || "465";

export default class MailService {
    private transporter?: nodeMailer.Transporter;
    private mailOption?: MailOptions;
    public senderMail?: string;
    public emailSent?: boolean;

    public constructor(
        public receiverMail?: string,
        public htmlPath?: string,
        public subject?: string,
        public text?: string,
        public senderDetail?: SenderDetail
    ) {
        this.senderMail = senderDetail?.email
            ? senderDetail?.email
            : process.env.MAIL_USER;
    }

    public async config() {
        // let testAccount = await nodeMailer.createTestAccount();
        let transportOption = {
            host: process.env.MAIL_HOST,
            port: 465,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        } satisfies SMTPTransport.Options;
        this.transporter = nodeMailer.createTransport(transportOption);
        return this;
    }

    public from(sender: SenderDetail) {
        this.senderMail = sender.email;
        this.senderDetail = sender;
        return this;
    }

    public to(receiverMail: string) {
        this.receiverMail = receiverMail;
        return this;
    }

    public setSubject(subject: string) {
        this.subject = subject;
        return this;
    }

    public content(htmlPath: string, text?: string) {
        this.htmlPath = htmlPath;
        this.text = text;
        return this;
    }

    public async send(
        provider: "mailtrap" | "smtp",
        res: express.Response,
        code: any
    ) {
        if (provider === "smtp") {
            this.mailOption = {
                to: this.receiverMail ?? "ingshelpidy@gmail.com",
                from: this.senderMail ?? process.env.MAIL_USER,
                html: this.htmlPath,
                text: this.text,
                subject: this.subject,
            };
            await this.config();

            this.transporter?.sendMail(this.mailOption, async (err) => {
                if (err) {
                    res.status(responseStatusCode.BAD_REQUEST).json({
                        status: responseStatus.ERROR,
                        message: "Error trying to send email",
                        data: err,
                    });
                    console.log(err);
                } else {
                    console.log("Email sent");
                    this.emailSent = true;
                    res.status(responseStatusCode.OK).json({
                        status: responseStatus.SUCCESS,
                        message: "Email sent successfully",
                        data: { confirmationCode: code },
                    });
                }
            });
        } else {
            let mailTrapOption = {
                to: [this.receiverMail, "teaxmarkit@gmail.com"],
                from: {
                    email: this.senderDetail || "ingshelpidy@gmail.com",
                    name: "Mexu",
                },
                html: this.htmlPath,
                text: this.text || "This is email text",
                subject: this.subject || "My subject",
            };
            return Promise.resolve(true);
        }
    }
}
