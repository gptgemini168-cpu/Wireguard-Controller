export type Profile = 'tw' | 'jp' | 'hk' | 'th';

export interface InterfaceStatus {
  active: boolean;
  profile?: string; // Only for 'ss' interface
}

export interface StatusResponse {
  wg0: InterfaceStatus;
  ss: InterfaceStatus;
}

export interface WG0Request {
  enabled: boolean;
}

export interface SSRequest {
  enabled: boolean;
}

export interface SSProfileRequest {
  profile: Profile;
  restart?: boolean;
}

export interface ApplyRequest {
  wg0_enabled?: boolean;
  ss_enabled?: boolean;
  ss_profile?: Profile;
}

export interface ErrorResponse {
  detail: string;
}

// AI Types
export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
