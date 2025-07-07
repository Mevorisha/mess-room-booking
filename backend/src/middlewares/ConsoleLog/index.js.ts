import { NextApiRequest, NextApiResponse } from "next";

export function consoleLog(req: NextApiRequest, res: NextApiResponse): void {
  const method = (req.method ?? "unknown").toUpperCase();
  const url = req.url ?? "unknown";
  const statusCode = res.statusCode;

  function getClientIPv4or6() {
    const ipv4Regex = /\b(\d{1,3}\.){3}\d{1,3}\b/;
    const remoteAddress = req.socket.remoteAddress ?? "unknown";
    const match = remoteAddress.match(ipv4Regex);
    const extractedIp = match ? match[0] : remoteAddress;
    return extractedIp;
  }

  function getFormattedDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  function colorStatusCode(statusCode: number) {
    if (statusCode >= 200 && statusCode < 300) {
      return `\x1b[32m${statusCode}\x1b[0m`; // Green
    } else if (statusCode >= 300 && statusCode < 400) {
      return `\x1b[34m${statusCode}\x1b[0m`; // Blue
    } else if (statusCode >= 400 && statusCode < 500) {
      return `\x1b[33m${statusCode}\x1b[0m`; // Yellow
    } else if (statusCode >= 500 && statusCode < 600) {
      return `\x1b[31m${statusCode}\x1b[0m`; // Red
    } else {
      return statusCode;
    }
  }

  const logType = statusCode >= 500 ? "E" : "I";

  function log(d: void | NextApiResponse | undefined) {
    console.log(
      `[${logType}] [${getFormattedDateTime()}] ${getClientIPv4or6()} ${method} ${url} ${colorStatusCode(statusCode)}`
    );
    return d;
  }

  log();
}
