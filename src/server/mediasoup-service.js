const mediasoup = require('mediasoup');

const DEFAULT_MEDIA_CODECS = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
  },
];

class MediasoupService {
  constructor() {
    this.workers = [];
    this.routers = new Map();
    this.nextWorker = 0;
  }

  async init({ numWorkers = 1, rtcMinPort = 40000, rtcMaxPort = 49999 } = {}) {
    if (this.workers.length > 0) return;

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        rtcMinPort,
        rtcMaxPort,
        logLevel: 'warn',
      });

      worker.on('died', () => {
        console.error('mediasoup worker died, exiting...');
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push(worker);
    }
  }

  getWorker() {
    if (this.workers.length === 0) throw new Error('No mediasoup workers initialized');
    const worker = this.workers[this.nextWorker];
    this.nextWorker = (this.nextWorker + 1) % this.workers.length;
    return worker;
  }

  async getOrCreateRouter(roomId) {
    if (this.routers.has(roomId)) return this.routers.get(roomId);
    const worker = this.getWorker();
    const router = await worker.createRouter({ mediaCodecs: DEFAULT_MEDIA_CODECS });
    this.routers.set(roomId, router);
    return router;
  }

  async createWebRtcTransport(router) {
    const transport = await router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || undefined }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }

  async connectTransport(transport, dtlsParameters) {
    await transport.connect({ dtlsParameters });
  }

  // Create a consumer on server-side transport
  async createConsumer(transport, producerId, rtpCapabilities) {
    // router canConsume should be checked by caller
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false,
    });
    return consumer;
  }

  async canConsume(router, producerId, rtpCapabilities) {
    try {
      return router.canConsume({ producerId, rtpCapabilities });
    } catch (err) {
      return false;
    }
  }

  async cleanup() {
    for (const worker of this.workers) {
      try {
        await worker.close();
      } catch (e) {}
    }
    this.workers = [];
    this.routers.clear();
  }
}

module.exports = new MediasoupService();
