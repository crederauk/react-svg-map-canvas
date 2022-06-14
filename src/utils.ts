import { StraightSegment, LineDef } from './types'

// from stack overflow https://stackoverflow.com/questions/13937782/calculating-the-point-of-intersection-of-two-lines
export const intersect = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false
  }

  const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

  // Lines are parallel
  if (denominator === 0) {
    return false
  }

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

  // is the intersection along the segments
  // if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
  //   return false
  // }

  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1)
  let y = y1 + ua * (y2 - y1)

  return {x, y}
}

export const lineToAngle = (cx: number, cy: number, ex: number, ey: number) => {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta;
}

export const getAngleAtPathPt = (path: SVGPathElement, length: number) => {
  const ptOnPathA = path.getPointAtLength(length * 0.999);
  const ptOnPathB = path.getPointAtLength(Math.max(length  * 1.001, 0.001));
  return lineToAngle(ptOnPathA.x, ptOnPathA.y, ptOnPathB.x, ptOnPathB.y);
}

export const lineToPathDef = (line: LineDef) => {
  let land1PathDef = 'from' in line[0] ? `M ${line[0].from.x} ${line[0].from.y}` : 'M 0 0';

  line.forEach((seg, index) => {
    switch (seg.mode) {
      case 'straight':
        land1PathDef += ` L ${seg.to.x} ${seg.to.y}`;
        break;
      case 'quadraticCurve':
        const line1 = line[index - 1]?.mode === 'straight' ? line[index - 1] as StraightSegment : undefined;
        const line2 = line[index + 1]?.mode === 'straight' ? line[index + 1] as StraightSegment : undefined;
        if (line1 && line2) {
          const intersectPt = intersect(line1.from.x, line1.from.y, line1.to.x, line1.to.y, line2.from.x, line2.from.y, line2.to.x, line2.to.y)
          if (intersectPt) {
            land1PathDef += ` Q ${intersectPt.x} ${intersectPt.y} ${line2.from.x} ${line2.from.y}`;
          }
        }
        break;
    }
  });

  return land1PathDef;
}