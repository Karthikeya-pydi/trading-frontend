// =============================================================================
// BHAVCOPY DATA TYPES
// =============================================================================

export interface BhavcopyRecord {
  SYMBOL: string
  SERIES: string
  DATE1: string
  PREV_CLOSE: number
  OPEN_PRICE: number
  HIGH_PRICE: number
  LOW_PRICE: number
  LAST_PRICE: number
  CLOSE_PRICE: number
  AVG_PRICE: number
  TTL_TRD_QNTY: number
  TURNOVER_LACS: number
  NO_OF_TRADES: number
  DELIV_QTY: number | string
  DELIV_PER: number | string
}

export interface BhavcopyResponse {
  message: string
  total_records: number
  data: BhavcopyRecord[]
}

export interface BhavcopyFile {
  filename: string
  s3_key: string
  size_mb: number
  last_modified: string
  source: string
}

export interface BhavcopyFilesListResponse {
  message: string
  files: BhavcopyFile[]
  total_files: number
  source: string
  timestamp: string
}

export interface BhavcopyFileDataResponse {
  message: string
  total_records: number
  source_file: string
  file_size_mb: number
  last_modified: string
  source: string
  data: BhavcopyRecord[]
}

