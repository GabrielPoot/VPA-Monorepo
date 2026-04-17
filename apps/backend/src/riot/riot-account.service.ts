import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { RiotApiService } from './riot-api.service';

@Injectable()
export class RiotAccountService {
  constructor(private readonly riotApi: RiotApiService) {}

  /**
   * Fetches account from Riot Account-V1 by GameName and TagLine.
   * Returns PUUID and basic info.
   */
  async verifyAccount(gameName: string, tagLine: string, region: string) {
    // Account API uses global clusters. 
    const baseUrl = this.riotApi.getBaseUrl(region, true);
    
    // Normalize URI to avoid issues
    const encodedGameName = encodeURIComponent(gameName);
    const encodedTagLine = encodeURIComponent(tagLine);

    try {
      const response = await this.riotApi.axios.get(
        `${baseUrl}/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}`
      );
      
      return response.data; // { puuid, gameName, tagLine }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Riot Account ${gameName}#${tagLine} not found.`);
      }
      throw new InternalServerErrorException(
        `Failed to reach Riot API: ${error.message}`
      );
    }
  }
}
