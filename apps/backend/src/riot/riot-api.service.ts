import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axiosRetry from 'axios-retry';

@Injectable()
export class RiotApiService implements OnModuleInit {
  private readonly apiKey: string;

  constructor(private readonly httpService: HttpService) {
    this.apiKey = process.env.RIOT_API_KEY || '';
    if (!this.apiKey) {
      console.warn('RIOT_API_KEY is missing in environment variables');
    }
  }

  onModuleInit() {
    this.configureAxios();
  }

  private configureAxios() {
    const axiosInstance = this.httpService.axiosRef;

    // Attach Riot Token automatically
    axiosInstance.interceptors.request.use((config) => {
      config.headers = config.headers || {};
      config.headers['X-Riot-Token'] = this.apiKey;
      return config;
    });

    // Configure exponential backoff
    axiosRetry(axiosInstance, {
      retries: 3,
      retryDelay: (retryCount) => {
        // [1s, 2s, 4s] delay
        return Math.pow(2, retryCount - 1) * 1000;
      },
      retryCondition: (error) => {
        return (
          error.response?.status === 429 ||
          error.response?.status === 502 ||
          error.response?.status === 503 ||
          error.response?.status === 504
        );
      },
    });
  }

  /**
   * Generates base url depending on the region context
   */
  getBaseUrl(region: string, isAccountApi: boolean = false): string {
    // For Account API, Riot uses wider clusters: americas, europe, asia
    if (isAccountApi) {
      if (['na', 'latam', 'br'].includes(region.toLowerCase())) return 'https://americas.api.riotgames.com';
      if (['eu', 'eune', 'euw'].includes(region.toLowerCase())) return 'https://europe.api.riotgames.com';
      return 'https://asia.api.riotgames.com'; // ap, kr
    }

    // For Valorant Match API, it's specific like ap, br, eu, kr, latam, na
    const sanitizedRegion = region.toLowerCase();
    switch (sanitizedRegion) {
      case 'latam':
      case 'br':
      case 'na':
        // Wait, Valorant match URL structure is usually region.api.riotgames.com or specific clusters?
        // Valorant specific routing: na.api.riotgames.com, eu.api.riotgames.com, ap.api.riotgames.com, ...
        return `https://${sanitizedRegion}.api.riotgames.com`;
      default:
        // default to na if unsure
        return `https://${sanitizedRegion}.api.riotgames.com`;
    }
  }

  get axios() {
    return this.httpService.axiosRef;
  }
}
