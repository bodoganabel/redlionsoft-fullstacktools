import Handlebars from "handlebars";
import { join } from "path";
import { readFile } from "fs/promises";
import * as nodemailer from "nodemailer";
import { isProduction } from "../../common";

export class EmailService {
  private mailHost = process.env.MAIL_HOST as string;
  private mailPort = process.env.MAIL_PORT as string;
  private mailSecure = process.env.MAIL_SECURE as string;
  private mailDefaultName = process.env.MAIL_DEFAULT_NAME as string;
  private mailDefaultEmail = process.env.MAIL_DEFAULT_EMAIL as string;

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

    // Verify SMTP connection if in production
    if (isProduction()) {
      this.verifySmtpConnection().catch((error) => {
        console.error("⚠️ SMTP connection verification failed:", error.message);
      });
    }
  }

  private readonly transporter = nodemailer.createTransport({
    host: this.mailHost,
    port: parseInt(this.mailPort, 10),
    secure: this.mailSecure === "true",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      // Always require TLS for cPanel email
      rejectUnauthorized: true,
    },
  });

  private validateRequiredEnvVariables() {
    const requiredVars = [
      "MAIL_HOST",
      "MAIL_PORT",
      "MAIL_SECURE",
      "MAIL_USERNAME",
      "MAIL_PASSWORD",
      "MAIL_DEFAULT_NAME",
      "MAIL_DEFAULT_EMAIL",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
  }

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

      // Send the email using the transporter
      const result = await this.transporter.sendMail({
        from: options.useBaseTemplate
          ? `${this.mailDefaultName} <${this.mailDefaultEmail}>`
          : `${process.env.MAIL_DEFAULT_NAME} <${process.env.MAIL_USERNAME}>`,
        to: options.to,
        subject: options.subject,
        html,
        text: options.fallbackText,
      });

      console.log(
        `Email sent to ${options.to}, messageId: ${result.messageId}`
      );
      return { result };
    } catch (error) {
      console.error("Error sending template email:", error);
      return { result: undefined, error: String(error) };
    }
  }

  /**
   * Verifies SMTP connection by sending a test email to the server
   * @returns Promise that resolves if connection is valid, rejects with error if invalid
   */
  async verifySmtpConnection(): Promise<boolean> {
    try {
      // Log detailed configuration for debugging
      console.log("SMTP Connection Details:");
      console.log("- Host:", this.mailHost || "UNDEFINED");
      console.log("- Port:", this.mailPort || "UNDEFINED");
      console.log("- Secure:", this.mailSecure || "UNDEFINED");
      console.log("- Username:", process.env.MAIL_USERNAME || "UNDEFINED");
      console.log("- Is Production:", isProduction());

      // Verify connection
      await this.transporter.verify();

      console.log("✅ SMTP connection verified successfully");
      return true;
    } catch (error) {
      const errorMessage = `SMTP connection verification failed: ${error}`;
      console.error("❌ " + errorMessage);
      console.error("Full error details:", error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Manually verify SMTP connection
   * @returns Promise<boolean> indicating if connection is valid
   */
  async testSmtpConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.verifySmtpConnection();
      return {
        success: true,
        message: `SMTP connection verified successfully for host: ${this.mailHost}`,
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  async send(options: {
    to: string;
    subject: string;
    html: string;
    fallbackText?: string;
  }): Promise<{ result: any; error?: string }> {
    try {
      const result = await this.transporter.sendMail({
        from: `${this.mailDefaultName} <${process.env.MAIL_USERNAME}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.fallbackText,
      });

      console.log(
        `Email sent to ${options.to}, messageId: ${result.messageId}`
      );
      return { result };
    } catch (error) {
      console.error("Error sending email:", error);
      return { result: undefined, error: String(error) };
    }
  }
}
