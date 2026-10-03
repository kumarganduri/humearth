// Hum v2 entry point. Stage 1a, T2: only the legacy clean-up so far; T4 adds the hero and slider.
import './base.css';
import './home.css';
import { cleanUpV1 } from './legacy';

cleanUpV1(globalThis.localStorage, globalThis.location, globalThis.history);
