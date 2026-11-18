import { createApp } from './app.js';
import { loadConfig } from './common/config.js';
import { PlatformStore } from './db/store.js';

const config = loadConfig();
const store = new PlatformStore(config.sqlitePath);
const app = createApp(store, config);

app.listen(config.port, () => {
  console.log(
    `[Haus & Co API] Listening on http://localhost:${config.port} (demoMode=${config.demoMode}, payhereMode=${config.payhereMode})`
  );
});
