import re

def parse_messy_text(text: str) -> dict:
    """
    Mock parser as requested:
    - If the text contains a number, treat that as the quantity.
    - If it contains a capitalized word, treat it as the client name.
    """
    quantity = 1
    client_name = "Unknown Client"
    item_name = "Custom Order"
    
    # 1. Number -> Quantity
    qty_match = re.search(r"\b(\d+)\b", text)
    if qty_match:
        quantity = int(qty_match.group(1))
        
    # 2. Capitalized Word -> Client Name
    # Find all capitalized words. Skip common ones to get the actual name.
    capitalized_words = re.findall(r"\b([A-Z][A-Za-z]+)\b", text)
    filtered = [w for w in capitalized_words if w.lower() not in ["thalis", "thali", "veg", "baron", "kitchen"]]
    if filtered:
        # Pick the last capitalized word as the name (e.g. "- Kunal")
        client_name = filtered[-1]

    # Optional: try to find the item string contextually or default to standard
    if "thali" in text.lower():
        item_name = "Veg Thali"

    return {
        "client_name": client_name,
        "source": "WhatsApp", # Identifying this to trigger green badge
        "items": [
            {
                "item_name": item_name,
                "quantity": quantity
            }
        ]
    }
