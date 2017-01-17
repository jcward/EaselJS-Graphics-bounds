// - - - - - - - - - - - - - - - - - - - - - - -
// - - This cubicBzBounds function is from:
// - - - - - - - - - - - - - - - - - - - - - - -
// http://stackoverflow.com/a/24814530/1026023
// http://jsfiddle.net/SalixAlba/QQnvm/4/
// - - - - - - - - - - - - - - - - - - - - - - -
// I fixed an instability at a==0, see below
// - - - - - - - - - - - - - - - - - - - - - - -
this.createjs.cubicBzBounds = function(p0, p1, p2, p3) // returns [x0, y0, x1, y1]
{

  function evalBez(poly, t) {
    var x = poly[0] * (1 - t) * (1 - t) * (1 - t) + 3 * poly[1] * t * (1 - t) * (1 - t) + 3 * poly[2] * t * t * (1 - t) + poly[3] * t * t * t;
    return x;
  }

  var P = [p0, p1, p2, p3];
  var PX = [P[0].x, P[1].x, P[2].x, P[3].x];
  var PY = [P[0].y, P[1].y, P[2].y, P[3].y];

  var a = 3 * P[3].x - 9 * P[2].x + 9 * P[1].x - 3 * P[0].x;
  if (a==0) a = 0.0000001; // stability addition
  var b = 6 * P[0].x - 12 * P[1].x + 6 * P[2].x;
  var c = 3 * P[1].x - 3 * P[0].x;
  //console.log("a "+a+" "+b+" "+c);
  var disc = b * b - 4 * a * c;
  var xl = P[0].x;
  var xh = P[0].x;
  if (P[3].x < xl) xl = P[3].x;
  if (P[3].x > xh) xh = P[3].x;
  //console.log("disc1 = "+disc);
  if (disc >= 0) {
      var t1 = (-b + Math.sqrt(disc)) / (2 * a);
      //console.log("t1 " + t1);
      if (t1 >= 0 && t1 <= 1) {
          var x1 = evalBez(PX, t1);
          //console.log("x1 = "+x1);
          if (x1 < xl) xl = x1;
          if (x1 > xh) xh = x1;
      }

      var t2 = (-b - Math.sqrt(disc)) / (2 * a);
      //console.log("t2 " + t2);
      if (t2 >= 0 && t2 <= 1) {
          var x2 = evalBez(PX, t2);
          //console.log("x2 = "+x2);
          if (x2 < xl) xl = x2;
          if (x2 > xh) xh = x2;
      }
  }

  a = 3 * P[3].y - 9 * P[2].y + 9 * P[1].y - 3 * P[0].y;
  if (a==0) a = 0.0000001; // stability addition
  b = 6 * P[0].y - 12 * P[1].y + 6 * P[2].y;
  c = 3 * P[1].y - 3 * P[0].y;
  disc = b * b - 4 * a * c;
  var yl = P[0].y;
  var yh = P[0].y;
  if (P[3].y < yl) yl = P[3].y;
  if (P[3].y > yh) yh = P[3].y;
  //console.log("disc2 = "+disc);
  if (disc >= 0) {
      var t1 = (-b + Math.sqrt(disc)) / (2 * a);
      //console.log("t3 " + t1);

      if (t1 >= 0 && t1 <= 1) {
          var y1 = evalBez(PY, t1);
          //console.log("y1 = "+y1);
          if (y1 < yl) yl = y1;
          if (y1 > yh) yh = y1;
      }

      var t2 = (-b - Math.sqrt(disc)) / (2 * a);
      //console.log("t4 " + t2);

      if (t2 >= 0 && t2 <= 1) {
          var y2 = evalBez(PY, t2);
          //console.log("y2 = "+y2);
          if (y2 < yl) yl = y2;
          if (y2 > yh) yh = y2;
      }
  }

  return [xl, yl, xh, yh];
}
