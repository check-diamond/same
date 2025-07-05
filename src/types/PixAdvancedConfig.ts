export interface PixAdvancedConfig {
  interCertificateUploaded?: boolean;
  interCertificateData?: string;
  interCertificatePath?: string;
  interCertificatePassword?: string;

  clientId?: string;
  clientSecret?: string;
  sandbox?: boolean;

  webhookUrl?: string;
  certificateExpiration?: string;

  pixKey?: string;
  merchantName?: string;
  merchantCity?: string;
}
