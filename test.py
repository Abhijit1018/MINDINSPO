import requests
import json
import time

res = requests.post('http://localhost:5000/api/ideas/submit', json={"raw_input": "Build a decentralized social network using IPFS"})
print(res.json())
entry_id = res.json().get('entry_id')

if entry_id:
    # Wait for a brief moment to simulate processing
    time.sleep(2)
    
    mock_payload = {
      "entry_id": entry_id,
      "summary": "A decentralized social network leveraging IPFS for peer-to-peer data storage, avoiding central servers.",
      "tech_stack": ["React", "IPFS", "OrbitDB", "Web3.js", "Ethereum"],
      "pros_cons": {
        "pros": ["Censorship resistant", "No single point of failure", "User data ownership"],
        "cons": ["Slower performance", "Complex data moderation", "Onboarding friction"]
      },
      "similar_tools": ["Mastodon", "Lens Protocol", "Farcaster"],
      "mermaid_syntax": "graph TD;\n  A[User Client] --> B[IPFS Node];\n  B --> C[OrbitDB];\n  C --> D[Ethereum Smart Contract];",
      "image_url": "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=800"
    }
    res2 = requests.post('http://localhost:5000/api/webhooks/n8n-callback', json=mock_payload)
    print("Callback:", res2.json())
