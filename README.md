# hum

See how much water, air and power AI uses, as your own little living world.

Hum is an open-source website for kids (and grown-ups). Spin a toy-globe Earth with glowing AI buildings, answer three quick questions, and dive down into your own clay world. Use AI pictures and videos a lot and your world goes quiet; make greener choices and it blooms. Every number has a range and a source.

**Status:** early build. The footprint engine and sourced data pipeline are in; the 3D globe and dive are next.

## Develop

```bash
npm install
npm run derive:k     # choose the health scale and check the "no guilt" guardrails
npm run build:data   # validate sourced numbers -> public/data/constants.json
npm test
```

## How the numbers work

See `data/sources/constants.source.json` for every figure and its sources, and `data/changelog.json` for every change we've made to them. Your world's health is a designed scale, not a measurement: your weekly AI use compared with a multiple of the average person's share of all data-centre electricity.

## License

MIT. See `LICENSE`.
