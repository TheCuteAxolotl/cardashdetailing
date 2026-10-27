export type GmailConnectionStage = "inbox" | "sending" | "encryption" | "saving";
export class GmailConnectionError extends Error {
  constructor(public readonly stage: GmailConnectionStage, public readonly reason: string, message: string) { super(message); }
}
export function connectionFailure(stage: GmailConnectionStage, error: unknown) {
  const info = error && typeof error === "object" ? error as {code?:unknown;authenticationFailed?:unknown;responseCode?:unknown;serverResponseCode?:unknown} : {};
  const code=String(info.code||"");
  if(stage==="encryption")return new GmailConnectionError(stage,"server_config","The website could not secure the Gmail connection. This is a server configuration issue, not an App Password issue.");
  if(stage==="saving")return new GmailConnectionError(stage,"database","Gmail accepted the connection, but the website could not save it. Please try again.");
  if(info.authenticationFailed || code==="EAUTH" || Number(info.responseCode)===535 || info.serverResponseCode==="AUTHENTICATIONFAILED")return new GmailConnectionError(stage,"authentication",`Google rejected ${stage==="inbox"?"inbox":"sending"} sign-in for cardashdetailing.il@gmail.com. Make sure the App Password was created while signed into that exact Google account.`);
  if(["ETIMEDOUT","ESOCKET","ECONNECTION","ECONNREFUSED","ENETUNREACH","EHOSTUNREACH","ENOTFOUND","EAI_AGAIN","ETIMEOUT"].includes(code))return new GmailConnectionError(stage,"network",`The website could not reach Gmail's ${stage==="inbox"?"inbox":"sending"} server. This is a connection issue; keep your current App Password and retry.`);
  return new GmailConnectionError(stage,"provider",`Gmail ${stage==="inbox"?"inbox":"sending"} setup did not finish. Retry once. If it still fails, report this code: ${stage.toUpperCase()}_CONNECTION.`);
}
