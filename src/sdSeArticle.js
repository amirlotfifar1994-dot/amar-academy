import {describe} from './stats.js';
import {samplingModel} from './samplingMean.js';
export const sdSeWorkedValues=[6,7,8,9,10];
export function sdSeWorkedExample(){const summary=describe(sdSeWorkedValues);return {...summary,se:summary.sd/Math.sqrt(summary.n)};}
export function sdSeExactExample(){return samplingModel([2,4,6],2);}
export function illustrativeMeanSE(n){return Number.isInteger(n)&&n>=4&&n<=400?2/Math.sqrt(n):null;}
