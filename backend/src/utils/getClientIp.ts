import { NextApiRequest } from "next";

export function getPossibleClientIp(req: NextApiRequest): string {
  const ipv4Regex = /\b(\d{1,3}\.){3}\d{1,3}\b/;
  const ipv6Regex = /([a-fA-F0-9:]+:+)+[a-fA-F0-9]+/;

  let ip;

  const forwarded = req.headers["x-forwarded-for"];

  let forwardedIps: string[] = [];

  if (typeof forwarded === "string") {
    forwardedIps = forwarded.split(",").map((ip) => ip.trim());
  } else if (Array.isArray(forwarded)) {
    // join all entries and split
    forwardedIps = forwarded.map((ip) => ip.trim());
  }

  for (const candidate of forwardedIps) {
    if (ipv4Regex.test(candidate) || ipv6Regex.test(candidate)) {
      const matchV4 = candidate.match(ipv4Regex);
      if (matchV4 != null) {
        ip = matchV4[0];
      } else if (ipv6Regex.test(candidate)) {
        ip = candidate;
      } else {
        ip = "unknown";
      }
      break;
    }
  }

  // Fallback to remoteAddress
  if (ip == null) {
    const remoteAddress = req.socket.remoteAddress ?? "unknown";
    const matchV4 = remoteAddress.match(ipv4Regex);
    if (matchV4 != null) {
      ip = matchV4[0];
    } else if (ipv6Regex.test(remoteAddress)) {
      ip = remoteAddress;
    } else {
      ip = "unknown";
    }
  }

  return ip;
}
