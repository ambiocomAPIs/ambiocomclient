export const DEFAULT_STATUS_ORDER = [
  "0",
  "200",
  "201",
  "202",
  "204",
  "207",
  "300",
  "301",
  "302",
  "304",
  "400",
  "401",
  "403",
  "404",
  "409",
  "422",
  "429",
  "500",
  "502",
  "503",
  "504",
  "N/A",
];

export const getStatusLabel = (status) => {
  const code = String(status ?? "N/A");

  switch (code) {
    case "0":
      return "network/offline";
    case "200":
      return "ok";
    case "201":
      return "created";
    case "202":
      return "accepted";
    case "204":
      return "no-content";
    case "207":
      return "multi-status";
    case "300":
      return "multiple-choices";
    case "301":
      return "moved-permanently";
    case "302":
      return "found";
    case "304":
      return "not-modified";
    case "400":
      return "bad-request";
    case "401":
      return "unauthorized";
    case "403":
      return "forbidden";
    case "404":
      return "not-found";
    case "409":
      return "conflict";
    case "422":
      return "unprocessable";
    case "429":
      return "too-many-requests";
    case "500":
      return "server-error";
    case "502":
      return "bad-gateway";
    case "503":
      return "service-unavailable";
    case "504":
      return "gateway-timeout";
    default:
      return "status";
  }
};

export const sortStatuses = (entries) => {
  const orderMap = new Map(DEFAULT_STATUS_ORDER.map((code, index) => [code, index]));

  return [...entries].sort((a, b) => {
    const aKey = String(a.status);
    const bKey = String(b.status);

    const aOrder = orderMap.has(aKey) ? orderMap.get(aKey) : Number.MAX_SAFE_INTEGER;
    const bOrder = orderMap.has(bKey) ? orderMap.get(bKey) : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) return aOrder - bOrder;

    const aNum = Number(aKey);
    const bNum = Number(bKey);

    if (Number.isNaN(aNum) && Number.isNaN(bNum)) return aKey.localeCompare(bKey);
    if (Number.isNaN(aNum)) return 1;
    if (Number.isNaN(bNum)) return -1;

    return aNum - bNum;
  });
};