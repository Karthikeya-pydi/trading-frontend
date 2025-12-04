#!/usr/bin/env python3
"""
Script to read and convert parquet files to CSV
Usage:
    python scripts/read_parquet.py [input_file] [output_file] [--read-only]
"""

import sys
import os
import pandas as pd
import argparse
from pathlib import Path

def read_parquet_file(file_path):
    """Read a parquet file and return the DataFrame"""
    try:
        print(f"Reading parquet file: {file_path}")
        
        # Read the parquet file
        df = pd.read_parquet(file_path, engine='pyarrow')
        
        print(f"\nFile Information:")
        print(f"   Total rows: {len(df)}")
        print(f"   Total columns: {len(df.columns)}")
        print(f"\nColumn Names:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i}. {col}")
        
        print(f"\nFirst 5 rows preview:")
        print(df.head().to_string())
        
        print(f"\nData Types:")
        print(df.dtypes.to_string())
        
        print(f"\nSuccessfully read {len(df)} rows from parquet file\n")
        
        return df
    except Exception as error:
        print(f"Error reading parquet file: {error}")
        raise

def convert_to_csv(df, output_path):
    """Convert DataFrame to CSV"""
    try:
        if df.empty:
            print("Warning: No data to convert")
            return
        
        # Convert to CSV
        df.to_csv(output_path, index=False)
        
        print(f"Successfully converted to CSV: {output_path}")
        print(f"   Total rows: {len(df)}")
        print(f"   Total columns: {len(df.columns)}")
    except Exception as error:
        print(f"Error converting to CSV: {error}")
        raise

def main():
    parser = argparse.ArgumentParser(description='Read and convert parquet files to CSV')
    parser.add_argument('input_file', nargs='?', 
                       default='instrument_master_2025-12-04 1.parquet',
                       help='Input parquet file path')
    parser.add_argument('output_file', nargs='?',
                       default='instrument_master_2025-12-04.csv',
                       help='Output CSV file path')
    parser.add_argument('--read-only', action='store_true',
                       help='Only read the file, do not convert to CSV')
    
    args = parser.parse_args()
    
    # Resolve file paths
    project_root = Path(__file__).parent.parent
    input_path = Path(args.input_file) if Path(args.input_file).is_absolute() else project_root / args.input_file
    output_path = Path(args.output_file) if Path(args.output_file).is_absolute() else project_root / args.output_file
    
    if not input_path.exists():
        print(f"File not found: {input_path}")
        sys.exit(1)
    
    try:
        # Read the parquet file
        df = read_parquet_file(str(input_path))
        
        # Convert to CSV if not read-only
        if not args.read_only:
            print("\nConverting to CSV...")
            convert_to_csv(df, str(output_path))
        else:
            print("\nRead-only mode: CSV conversion skipped")
        
        print("\nDone!")
    except Exception as error:
        print(f"Failed: {error}")
        sys.exit(1)

if __name__ == '__main__':
    main()

