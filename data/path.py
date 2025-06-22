def convert_path(path):
    # Replace backslashes with forward slashes
    new_path = path.replace("\\", "/")
    
    # Add ./ at the beginning if not already present
    if not new_path.startswith("./"):
        new_path = "./" + new_path
    
    return new_path

# Original path
original_path = r"assets\ProductImages\Souris\SOURIS GAMER RAZER DEATHADDER V3\71ELE0pWiTL._AC_SX425_.jpg"

# Convert and print
converted_path = convert_path(original_path)
print(converted_path)
