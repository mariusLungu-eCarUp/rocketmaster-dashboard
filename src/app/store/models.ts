export enum StationState {
  NotActive = 0,
  Free = 1,
  Occupied = 2,
  Maintenance = 3,
  Reserved = 4,
  Unknown = 5,
  Preparing = 6,
}

export enum StationType {
  SmartMeMeter = 0,
  OCPP = 1,
}

export enum StationSubType {
  OnOffStation = 0,
  WallBeStationV1 = 1,
  JuiceBoosterV1 = 2,
  EnercabWallboxT2 = 3,
  LadEV1 = 4,
  WallBeStationV2 = 5,
  PicoV1 = 6,
}

export const STATION_TYPE_LABELS: Record<StationType, string> = {
  [StationType.SmartMeMeter]: 'Smart-me',
  [StationType.OCPP]: 'OCPP',
};

export const STATION_SUBTYPE_LABELS: Record<StationSubType, string> = {
  [StationSubType.OnOffStation]: 'On/Off',
  [StationSubType.WallBeStationV1]: 'WallBe V1',
  [StationSubType.JuiceBoosterV1]: 'Juice Booster V1',
  [StationSubType.EnercabWallboxT2]: 'Enercab Wallbox T2',
  [StationSubType.LadEV1]: 'LadE V1',
  [StationSubType.WallBeStationV2]: 'WallBe V2',
  [StationSubType.PicoV1]: 'Pico V1',
};

export type UserVerificationStatus = string;

export interface Feature {
  Type: string;
}

export interface LicenseCoverage {
  LicenseCount: number;
  ConnectorCount: number;
  Tier: string;
  Status: string;
}

export interface RocketmasterUser {
  Id: string;
  Identification: string;
  AnonymizedEmail: string;
  VerificationStatus: UserVerificationStatus;
  Features: Feature[];
  LicenseCoverage: LicenseCoverage;
}

export enum StationPlugType {
  Unknown = 0,
  Type2 = 1,
  Schuko = 2,
  Swiss = 3,
  UK = 4,
  CCS = 5,
  CHAdeMO = 6,
}

export enum StationAccessType {
  Public = 0,
  Limited = 1,
  Private = 2,
}

export const PLUG_TYPE_LABELS: Record<StationPlugType, string> = {
  [StationPlugType.Unknown]: 'Unknown',
  [StationPlugType.Type2]: 'Type 2',
  [StationPlugType.Schuko]: 'Schuko',
  [StationPlugType.Swiss]: 'Swiss',
  [StationPlugType.UK]: 'UK',
  [StationPlugType.CCS]: 'CCS',
  [StationPlugType.CHAdeMO]: 'CHAdeMO',
};

export const ACCESS_TYPE_LABELS: Record<StationAccessType, string> = {
  [StationAccessType.Public]: 'Public',
  [StationAccessType.Limited]: 'Limited',
  [StationAccessType.Private]: 'Private',
};

export interface AdminConnectorDto {
  Position: number;
  Name: string;
  PlugType: number;
  AccessType: number;
  EnergyPrice: number;
  ParkingPrice: number;
  Currency: string;
  SerialNumber: string;
  State?: StationState;
}

export interface AdminStationDto {
  Id: string;
  Name: string | null;
  UserId: string;
  CreatedAt: string;
  Type: number;
  SubType: number;
  Address: string;
  Connectors: AdminConnectorDto[];
  HubjectEvseIds: string[];
  HubjectPricingPlans: string[];
}

export interface AdminRfidCardData {
  Identification: string;
  Name: string;
  UserId: string;
  ValidUntil: string;
}

export interface CarId {
  Identification: string;
  Name: string;
  UserId: string;
  ValidUntil: string;
}

export interface AdminChargingDto {
  Id: string;
  StationId: string;
  StationName: string;
  Connector: number;
  DriverId: string;
  DriverName: string;
  ActivatedAt: string;
  Duration: string;
}

export interface License {
  Id: string;
  OwnerId: string;
  Tier: string;
  Quantity: number;
  StartDate: string;
  EndDate: string;
  IsCanceled: boolean;
  HasLastPaymentFailed: boolean;
  Comment: string;
}

export interface Permission {
  AssigneeId: string;
  AssigneeType: string;
  Type: string;
  TargetResourceType: string;
  TargetResourceId: string;
}

export interface OcppLogEntry {
  timestamp: string;
  direction: string;
  action: string;
  payload: unknown;
}
