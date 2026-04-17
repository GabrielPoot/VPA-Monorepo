import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RiotApiService } from './riot-api.service';

@Injectable()
export class RiotMatchService {
  constructor(private readonly riotApi: RiotApiService) {}

  /**
   * Obtiene la lista de IDs de partidas de un usuario y busca los detalles de
   * las que correspondan a Deathmatch (queueId === 'deathmatch').
   */
  async getDeathmatchMatches(puuid: string, region: string) {
    const baseUrl = this.riotApi.getBaseUrl(region);

    try {
      // 1. Obtener la lista de partidas recientes
      const summaryUrl = `${baseUrl}/val/match/v1/matchlists/by-puuid/${puuid}`;
      const listResponse = await this.riotApi.axios.get(summaryUrl);

      // history typically looks like: [{ matchId: string, queueId: string, gameStartTimeMillis: number }]
      const history = listResponse.data?.history || [];

      // Filtramos inicialmente si el endpoint incluye el queueId, si no lo incluye
      // (a veces la API lo omite) tendremos que consultarlo a fondo. 
      // Por optimización, seleccionaremos los últimos 10
      const recentMatches = history.slice(0, 10);

      // 2. Resolver los detalles de los matches simultáneamente
      const matchPromises = recentMatches.map((m: any) =>
        this.getMatchDetails(baseUrl, m.matchId, puuid)
      );

      const resolved = await Promise.allSettled(matchPromises);

      // 3. Destilar solo las existosas y que son realmente deathmatch
      const dmResults = resolved
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value)
        .filter(match => match.queueId === 'deathmatch');

      return dmResults;

    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to fetch matchlist from Riot: ${error.message}`
      );
    }
  }

  private async getMatchDetails(baseUrl: string, matchId: string, targetPuuid: string) {
    try {
      const matchResponse = await this.riotApi.axios.get(
        `${baseUrl}/val/match/v1/matches/${matchId}`
      );
      
      const matchInfo = matchResponse.data.matchInfo;
      
      // Si no es DM, ahorramos trabajo
      if (matchInfo.queueId !== 'deathmatch') {
        return null;
      }

      const players = matchResponse.data.players || [];
      const targetPlayer = players.find((p: any) => p.puuid === targetPuuid);

      if (!targetPlayer) return null;

      // Extraemos solo lo vital para nuestro Grading Engine
      return {
        matchId,
        queueId: matchInfo.queueId,
        gameLengthMillis: matchInfo.gameLengthMillis,
        gameStartMillis: matchInfo.gameStartMillis,
        mapId: matchInfo.mapId,
        stats: {
          score: targetPlayer.stats.score,
          kills: targetPlayer.stats.kills,
          deaths: targetPlayer.stats.deaths,
          assists: targetPlayer.stats.assists,
        }
      };
    } catch {
      // Ignorar matches fallidos para no romper el Promise.allSettled entero
      return null;
    }
  }
}
