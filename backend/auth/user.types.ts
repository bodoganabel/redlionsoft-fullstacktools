// For tracking guests
export type TGuestUser = {
  _id: string;
  email?: string;
  trackers?: {
    tokens: string[]; //random generated ids for devices saved in the local storages and in cookies
    ips: string[]; //ip addresses,
    userAgents: string[]; //user agents
  };
};

// For users in the database
export type TUserServerRls<ERoles, EPermissions, TMetadata = any> = {
  _id: string;
  email: string;
  password: string;
  role: ERoles; //For frontend display purposes
  permissions: EPermissions[];
  metadata: TMetadata;
  created_at?: string;
};

// For users in the client side - derived from server side
export type TUserClientRls<ERoles, EPermissions, TMetadata = any> = {
  email: string;
  role: ERoles;
  permissions: EPermissions[];
  metadata: TMetadata;
};
