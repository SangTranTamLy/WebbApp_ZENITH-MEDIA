import sys

file_path = sys.argv[1]
start_line = int(sys.argv[2]) - 1
end_line = int(sys.argv[3]) - 1

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Delete lines from start_line to end_line inclusive
del lines[start_line:end_line + 1]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print(f"Deleted lines {start_line + 1} to {end_line + 1} in {file_path}")
