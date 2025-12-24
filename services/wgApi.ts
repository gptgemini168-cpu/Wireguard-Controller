import { StatusResponse, WG0Request, SSRequest, SSProfileRequest, ApplyRequest } from '../types';

export class WireGuardService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  private async request<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`WG API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async getStatus(): Promise<StatusResponse> {
    return this.request<StatusResponse>('/v1/status');
  }

  async setWg0(enabled: boolean): Promise<StatusResponse> {
    const body: WG0Request = { enabled };
    return this.request<StatusResponse>('/v1/wg0', 'POST', body);
  }

  async setSs(enabled: boolean): Promise<StatusResponse> {
    const body: SSRequest = { enabled };
    return this.request<StatusResponse>('/v1/ss', 'POST', body);
  }

  async setSsProfile(profile: string, restart: boolean = true): Promise<StatusResponse> {
    const body: SSProfileRequest = { profile: profile as any, restart };
    return this.request<StatusResponse>('/v1/ss/profile', 'PUT', body);
  }

  async apply(config: ApplyRequest): Promise<StatusResponse> {
    return this.request<StatusResponse>('/v1/apply', 'POST', config);
  }
}