import { Elysia } from "elysia";
import si from 'systeminformation';
import { staticPlugin } from '@elysiajs/static';

const app = new Elysia()
  .use(staticPlugin({
    assets: "./public",
    prefix: "/"
  }))
  .ws('/ws', {
    open(ws) {
      console.log("WebSocket connection opened.");
      ws.subscribe('system-info');
    },
    close(ws) {
      console.log("WebSocket connection closed.");
      ws.unsubscribe('system-info');
    }
  })
  // .get("/system", async () => {
  //   const cpu = await si.cpu();
  //   const cpuCurrentSpeed = await si.cpuCurrentSpeed();
  //   const mem = await si.mem();
  //   const fs = await si.fsSize();

  //   return {
  //     cpu: { ...cpu, speed: cpuCurrentSpeed.cores[0]?.speed || cpuCurrentSpeed.avg },
  //     mem,
  //     fs
  //   };
  // })
  .listen(3000);

// Centralized data fetching and broadcasting
setInterval(async () => {
  try {
    const cpu = await si.cpu();
    const cpuCurrentSpeed = await si.cpuCurrentSpeed();
    const currentLoad = await si.currentLoad();
    const mem = await si.mem();
    const fs = await si.fsSize();
    const networkStats = await si.networkStats();

    const data = {
      cpu: { ...cpu, speed: cpuCurrentSpeed.avg, load: currentLoad.currentLoad },
      mem,
      fs,
      networkStats
    };

    // Publish data to all subscribed clients
    app.server?.publish('system-info', JSON.stringify(data));
  } catch (e) {
    console.error("Error fetching and broadcasting system info:", e);
  }
}, 2000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
