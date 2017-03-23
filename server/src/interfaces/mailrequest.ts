export interface IMailRequest {
    to: string
    subject: string
    text?: string
    html: string
}