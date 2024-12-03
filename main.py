import os
import csv
import json

# Path to the input CSV file
CSV_FILE = "kjv.csv"

# Output folder for the structured JSON files
OUTPUT_DIR = "bible"

# Function to create folders and files for the structured Bible data
def generate_bible_structure():
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found.")
        return

    # Create the root output directory if it doesn't exist
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Read the CSV file
    with open(CSV_FILE, mode="r", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            book = row["book"]
            chapter = row["chapter"]
            verse = row["verse"]
            text = row["text"]

            # Create folder paths for book and chapter
            book_path = os.path.join(OUTPUT_DIR, book)
            chapter_path = os.path.join(book_path, chapter)

            # Ensure directories exist
            os.makedirs(chapter_path, exist_ok=True)

            # File path for the verse JSON
            verse_file = os.path.join(chapter_path, f"{verse}.json")

            # Write the verse data to a JSON file
            verse_data = {
                "book": book,
                "chapter": int(chapter),
                "verse": int(verse),
                "text": text.strip(),
            }

            with open(verse_file, mode="w", encoding="utf-8") as jsonfile:
                json.dump(verse_data, jsonfile, indent=2)

    print(f"Bible structure generated in '{OUTPUT_DIR}' directory.")

# Run the script
if __name__ == "__main__":
    generate_bible_structure()
