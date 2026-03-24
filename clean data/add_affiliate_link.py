import argparse
import os
from typing import List

import pandas as pd


def add_affiliate_link_column(filename: str) -> pd.DataFrame:
    df = pd.read_csv(filename)

    # Ensure url column exists; if not, create empty so affiliate_link can be placed consistently
    if 'url' not in df.columns:
        df['url'] = ''

    if 'affiliate_link' not in df.columns:
        # Insert affiliate_link after url column when possible, otherwise append
        try:
            url_idx = df.columns.get_loc('url')
        except KeyError:
            url_idx = None

        cols: List[str] = list(df.columns)
        if url_idx is not None:
            cols.insert(url_idx + 1, 'affiliate_link')
        else:
            cols.append('affiliate_link')

        df['affiliate_link'] = df['url']
        df = df[cols]
    else:
        # Idempotent update: always mirror current url into affiliate_link
        df['affiliate_link'] = df['url']

    return df


def process_files(filepaths: List[str], output_dir: str | None, in_place: bool, dry_run: bool) -> None:
    for path in filepaths:
        if not os.path.exists(path):
            print(f"⚠️  Skipping missing file: {path}")
            continue

        original_df = pd.read_csv(path)
        updated_df = add_affiliate_link_column(path)

        # Determine write target
        if dry_run:
            print(f"DRY-RUN: Would update {path}")
            # Show a small preview of the first few rows and columns around url/affiliate_link
            preview_cols = [c for c in updated_df.columns if c in ['url', 'affiliate_link']]
            print(updated_df[preview_cols].head(5).to_string(index=False))
            continue

        write_path = path
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            write_path = os.path.join(output_dir, os.path.basename(path))
        elif not in_place:
            # Default: write alongside with suffix if not explicitly in-place
            base, ext = os.path.splitext(path)
            write_path = f"{base}.with_affiliate{ext}"

        updated_df.to_csv(write_path, index=False)
        print(f"✅ Added/updated affiliate_link column -> {write_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Add or update affiliate_link column based on url.")
    parser.add_argument(
        "files",
        nargs='*',
        help="CSV files to process. If omitted, defaults to cleaned_products.csv and cleaned_revolve_products.csv in the current directory.",
    )
    parser.add_argument(
        "--output-dir",
        dest="output_dir",
        default=None,
        help="Directory to write updated CSVs. If not set, writes in-place with --in-place or alongside with .with_affiliate suffix.",
    )
    parser.add_argument(
        "--in-place",
        action="store_true",
        help="Overwrite the input files in place.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write files; print a preview of changes.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    default_files = [
        'cleaned_products.csv',
        'cleaned_revolve_products.csv',
    ]

    files = args.files if args.files else default_files
    process_files(files, args.output_dir, args.in_place, args.dry_run)