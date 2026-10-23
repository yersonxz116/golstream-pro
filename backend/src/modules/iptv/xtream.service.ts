import axios from "axios";

export interface XtreamUserInfo {
  username: string;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  max_cons: string;
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  server_protocol: string;
}

export interface XtreamAuthResponse {
  user_info?: XtreamUserInfo;
  server_info?: XtreamServerInfo;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface XtreamStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon?: string;
  epg_channel_id?: string;
  added: string;
  category_id: string;
  custom_sid?: string;
  tv_archive?: number;
  direct_source?: string;
}

export const FOOTBALL_KEYWORDS = [
  "futbol",
  "fútbol",
  "football",
  "soccer",
  "laliga",
  "la liga",
  "premier",
  "champions",
  "serie a",
  "bundesliga",
  "ligue 1",
  "copa",
  "conmebol",
  "libertadores",
  "sudamericana",
  "espn",
  "dazn",
  "bein",
  "sky sports",
  "tnt sports",
  "directv",
  "win sports",
  "gol mundial",
  "fox sports",
  "deportes",
  "sports",
  "tUDN",
  "movistar liga",
  "movistar campeones",
];

function normalizeHost(host: string): string {
  let cleanHost = host.trim();
  if (!cleanHost.startsWith("http://") && !cleanHost.startsWith("https://")) {
    cleanHost = `http://${cleanHost}`;
  }
  return cleanHost.replace(/\/+$/, "");
}

export class XtreamService {
  /**
   * Tests connection and credentials against Xtream Codes player_api.php.
   */
  static async testCredentials(
    host: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; message: string; userInfo?: XtreamUserInfo }> {
    try {
      const baseUrl = normalizeHost(host);
      const url = `${baseUrl}/player_api.php`;

      const response = await axios.get<XtreamAuthResponse>(url, {
        params: { username, password },
        timeout: 8000,
        headers: { "User-Agent": "GolStreamPro/1.0" },
      });

      const data = response.data;
      if (data && data.user_info && data.user_info.status === "Active") {
        return {
          success: true,
          message: "Credenciales de Strong IPTV válidas y activas.",
          userInfo: data.user_info,
        };
      } else if (data && data.user_info) {
        return {
          success: false,
          message: `Cuenta IPTV encontrada con estado: ${data.user_info.status}`,
          userInfo: data.user_info,
        };
      }

      return {
        success: false,
        message: "Usuario o contraseña de IPTV incorrectos.",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al conectar con IPTV";
      return {
        success: false,
        message: `Fallo de conexión con el host IPTV: ${msg}`,
      };
    }
  }

  /**
   * Fetches live categories from Xtream Codes server.
   */
  static async getCategories(
    host: string,
    username: string,
    password: string
  ): Promise<XtreamCategory[]> {
    const baseUrl = normalizeHost(host);
    const url = `${baseUrl}/player_api.php`;

    const response = await axios.get<XtreamCategory[]>(url, {
      params: { username, password, action: "get_live_categories" },
      timeout: 10000,
    });

    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Fetches live streams from Xtream Codes server.
   */
  static async getLiveStreams(
    host: string,
    username: string,
    password: string,
    categoryId?: string
  ): Promise<XtreamStream[]> {
    const baseUrl = normalizeHost(host);
    const url = `${baseUrl}/player_api.php`;

    const params: Record<string, string> = {
      username,
      password,
      action: "get_live_streams",
    };
    if (categoryId) params.category_id = categoryId;

    const response = await axios.get<XtreamStream[]>(url, {
      params,
      timeout: 15000,
    });

    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Determines if a channel or category is related to football / sports.
   */
  static isFootballRelated(name: string, categoryName = ""): boolean {
    const target = `${name} ${categoryName}`.toLowerCase();
    return FOOTBALL_KEYWORDS.some((kw) => target.includes(kw.toLowerCase()));
  }

  /**
   * Builds the upstream HLS URL for a stream.
   */
  static buildHlsUrl(host: string, username: string, password: string, streamId: string): string {
    const baseUrl = normalizeHost(host);
    return `${baseUrl}/live/${username}/${password}/${streamId}.m3u8`;
  }
}
