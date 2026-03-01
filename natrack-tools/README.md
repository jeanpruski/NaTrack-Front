# natrack-tools (local only)

Petit serveur local pour générer les noms + descriptions des cartes via OpenAI.

## Installation
```bash
cd natrack-tools
npm install
cp .env.example .env
```

Renseigne `OPENAI_API_KEY` dans `.env`.

## Lancer
```bash
npm run dev
```

## Limite de budget (local)
Le serveur peut bloquer les appels quand le budget local est atteint.

Dans `.env`:
```
MAX_BUDGET_USD=10
OPENAI_COST_INPUT_PER_1M=0.15
OPENAI_COST_OUTPUT_PER_1M=0.60
```

Le suivi est enregistré dans `natrack-tools/.usage.json`.

## Endpoint
`POST http://localhost:8787/generate-cards`

Payload (exemple):
```json
{
  "theme": "Orage neon",
  "maxNameLength": 14,
  "cards": [
    {
      "id": "defi-1",
      "type": "defi",
      "distance_km": 5.2,
      "shoe_name": "Nike Pegasus 39",
      "visual": {
        "style": "epic fantasy illustration",
        "background": "misty forest trail",
        "angle": "low angle",
        "light": "golden hour lighting"
      }
    }
  ]
}
```

Réponse:
```json
{
  "items": [
    {
      "id": "defi-1",
      "name": "Orageon",
      "description": "..."
    }
  ]
}
```
