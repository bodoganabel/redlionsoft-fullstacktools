import Handlebars from "handlebars";
import { join } from "path";
import { readFile } from "fs/promises";
import * as nodemailer from "nodemailer";
import * as sgMail from "@sendgrid/mail";
import { isProduction } from "../../common";

export class EmailService {
  private mailHost = process.env.MAIL_HOST as string;
  private mailPort = process.env.MAIL_PORT as string;
  private mailClientPort = process.env.MAIL_CLIENT_PORT as string;
  private mailSecure = process.env.MAIL_SECURE as string;
  private mailDefaultName = process.env.MAIL_DEFAULT_NAME as string;
  private mailDefaultEmail = process.env.MAIL_DEFAULT_EMAIL as string;
  private sendGridApiKey = process.env.MAIL_PROD_SENDGRID_APIKEY as string;

  private baseTemplate!: Handlebars.TemplateDelegate<any>;

  private templateFolderPath_absolute: string;
  private baseTemplateFilePath_absolute: string;
  private baseTemplateProps: any;
  // Resolve the root folder dynamically

  constructor(initializer: {
    templateFolderPath_absolute: string;
    baseTemplateFilePath_relative: string;
    baseTemplateProps: (body: string) => {
      [key: string]: any | undefined;
      body: string;
    };
  }) {
    this.validateRequiredEnvVariables();
    if (isProduction()) {
      sgMail.setApiKey(this.sendGridApiKey as string);
    }

    this.templateFolderPath_absolute = join(
      initializer.templateFolderPath_absolute
    );
    this.baseTemplateFilePath_absolute = join(
      initializer.templateFolderPath_absolute,
      initializer.baseTemplateFilePath_relative
    );
    this.baseTemplateProps = initializer.baseTemplateProps;
    console.log(
      "Email service - Template folder path:",
      this.templateFolderPath_absolute
    );

    // Check if base template exists
    this.compileBaseTemplate();
  }

  private validateRequiredEnvVariables() {
    const requiredEnvVariables = [
      "MAIL_HOST",
      "MAIL_PORT",
      "MAIL_CLIENT_PORT",
      "MAIL_SECURE",
      "MAIL_DEFAULT_NAME",
      "MAIL_DEFAULT_EMAIL",
      "MAIL_REQUIRE_TLS",
      "MAIL_PROD_SENDGRID_APIKEY",
    ];

    requiredEnvVariables.forEach((variable) => {
      if (process.env[variable] === undefined) {
        throw new Error(`${variable} is undefined`);
      } else if (typeof process.env[variable] !== "string") {
        throw new Error(`${variable} is not a string`);
      }
    });
  }

  private readonly transporter = nodemailer.createTransport({
    host: this.mailHost,
    port: parseInt(this.mailPort, 10),
    secure: isProduction() ? this.mailSecure === "true" : false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: !isProduction()
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  });

  private async compileBaseTemplate() {
    console.log(
      "this.templateFolderPath_absolute, this.baseTemplateFilePath_relative:"
    );
    console.log(
      this.templateFolderPath_absolute,
      this.baseTemplateFilePath_absolute
    );
    const baseTemplateSource = await readFile(
      this.baseTemplateFilePath_absolute,
      "utf-8"
    );

    this.baseTemplate = Handlebars.compile(baseTemplateSource);
  }

  private async sendWithSendGrid(
    to: string,
    subject: string,
    html: string,
    fallbackText?: string
  ) {
    const msg: sgMail.MailDataRequired = {
      to,
      from: {
        email: this.mailDefaultEmail,
        name: this.mailDefaultName,
      },
      subject,
      html,
      text: fallbackText,
    };

    return sgMail.send(msg);
  }

  async sendTemplate(options: {
    to: string;
    subject: string;
    templateUrl_reative: string;
    templateParams: Record<string, any>;
    fallbackText?: string;
    useBaseTemplate?: boolean;
  }): Promise<{ result: any; error?: string }> {
    try {
      // Read and compile the specific template
      const templatePath = join(
        this.templateFolderPath_absolute,
        options.templateUrl_reative
      );
      const source = await readFile(templatePath, "utf-8");
      const templateCompile = Handlebars.compile(source);

      // Render the body using the provided parameters
      const body = templateCompile(options.templateParams);

      // Optionally wrap with the base template
      const html =
        options.useBaseTemplate === true
          ? this.baseTemplate(this.baseTemplateProps(body))
          : body;

      console.log("html:");
      console.log(html);

      // Check if we are in production to decide email sending method
      if (isProduction()) {
        try {
          const emailResult = await this.sendWithSendGrid(
            options.to,
            options.subject,
            html,
            options.fallbackText
          );
          return { result: emailResult };
        } catch (error) {
          throw new Error(`Email sending failed with SendGrid: ${error}`);
        }
      } else {
        console.log("Sent test email to devmail server at: localhost:1080");
        const result = await this.transporter.sendMail({
          from: this.mailDefaultEmail,
          to: options.to,
          subject: options.subject,
          html,
          text: options.fallbackText,
        });
        return { result };
      }
    } catch (error) {
      console.error("Error sending template email:", error);
      return { result: undefined, error: String(error) };
    }
  }

  async send(options: {
    to: string;
    subject: string;
    html: string;
    fallbackText?: string;
  }): Promise<{ result: any; error?: string }> {
    try {
      if (isProduction()) {
        try {
          const emailResult = await this.sendWithSendGrid(
            options.to,
            options.subject,
            options.html,
            options.fallbackText
          );
          return { result: emailResult };
        } catch (error) {
          throw new Error(`Email sending failed with SendGrid: ${error}`);
        }
      } else {
        console.log("Sent test email to devmail server at: localhost:1080");
        const result = await this.transporter.sendMail({
          from: this.mailDefaultEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.fallbackText,
        });
        return { result };
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return { result: undefined, error: String(error) };
    }
  }
}
