import { Injectable } from '@nestjs/common';

export enum Grade {
  EXCELLENT = 'EXCELLENT',
  PASSABLE = 'PASSABLE',
  BAD = 'BAD',
}

@Injectable()
export class GradingService {
  /**
   * Calculates the evaluation grade based on the raw score.
   * Assumes higher is better. For metrics where lower is better (e.g. time),
   * the score should be mathematically inverted before passing it here,
   * or a separate method should be created.
   *
   * @param score - The numerical result obtained by the user.
   * @param thresholdPass - The minimum score required to not fail.
   * @param thresholdExcellent - The score required to obtain max qualification.
   * @returns EXCELLENT, PASSABLE or BAD
   */
  calculateGrade(
    score: number,
    thresholdPass: number,
    thresholdExcellent: number,
  ): Grade {
    if (score >= thresholdExcellent) {
      return Grade.EXCELLENT;
    }
    if (score >= thresholdPass) {
      return Grade.PASSABLE;
    }
    return Grade.BAD;
  }
}
