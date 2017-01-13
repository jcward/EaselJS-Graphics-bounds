// Resize the canvas to fit only the drawn graphics, and optionally
// position the canvas (via CSS) at the top-left of the graphics area.
this.createjs.Graphics.prototype.drawAndSizeCanvas = function(canvas, no_retina)
{
  // Must calculate bounds first
  var bnd = this.getBounds();

  // Retina draws at 2x (a.k.a window.devicePixelRatio), and scales
  // the canvas down below (set width)
  var scale = no_retina ? 1 : window.devicePixelRatio;

  // Setting w/h automatically clears canvas
  canvas.width = (1+Math.floor(bnd.w))*scale;
  canvas.height = (1+Math.floor(bnd.h))*scale;

  // Based on bounds, transform graphics to top-left of canvas
  var ctx = canvas.getContext("2d");
  ctx.setTransform(scale,0,0,scale,-bnd.x*scale,-bnd.y*scale);

  if (scale!=1) {
    //canvas.style.backgroundColor = "#f00";// = 2*bnd.width+"px";
    canvas.style.width = bnd.w+"px";
  }

  // Draw
  this.draw(ctx);

  return bnd;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// This getBounds function licensed MIT, (c) Jeff Ward 2017  -
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
this.createjs.Graphics.prototype.getBounds = function()
{
  var G = createjs.Graphics;

  var minX = Infinity;
  var maxX = -Infinity;

  var minY = Infinity;
  var maxY = -Infinity;

  var i = 0;
  var instructions = this.getInstructions();
  var pending_points = [];
  var cur_stroke_style = null;
  var cur_pt = {x:0,y:0};

  function apply_points(width) {
    var half_width = width/2;
    for (pi in pending_points) {
      var pt = pending_points[pi];
      if (minX > pt.x - half_width) minX = pt.x - half_width;
      if (maxX < pt.x + half_width) maxX = pt.x + half_width;
      if (minY > pt.y - half_width) minY = pt.y - half_width;
      if (maxY < pt.y + half_width) maxY = pt.y + half_width;
    }
  }

  for (i in instructions) {
    var inst = instructions[i];

    // BeginPath - reset by flushing pending_points, style, cur_point
    if (inst instanceof G.BeginPath) {
      pending_points = [];
      cur_pt = {x:0,y:0};
      cur_stroke_style = null;
    }

    // Fill - apply pending_points with 0 line width
    else if (inst instanceof G.Fill) {
      // TODO: inst.matrix? when is it used?
      apply_points(0);
    }

    // Stroke
    else if (inst instanceof G.Stroke) {
      // TODO: ignoreScale?
      // TODO: caps, joints, miterlimit
      if (cur_stroke_style) {
        apply_points(cur_stroke_style.width);
      }
    }

    // StrokeStyle
    else if (inst instanceof G.StrokeStyle) {
      cur_stroke_style = inst;
    }

    // MoveTo / LineTo
    else if (inst instanceof G.MoveTo) { pending_points.push(inst); cur_pt = inst; }
    else if (inst instanceof G.LineTo) { pending_points.push(inst); cur_pt = inst; }

    // QuadraticCurveTo
    else if (inst instanceof G.QuadraticCurveTo) {
      // Lazy: convert to cubic and calc bounds
      var cp1x = cur_pt.x + 2/3 * (inst.cpx-cur_pt.x);
      var cp1y = cur_pt.y + 2/3 * (inst.cpy-cur_pt.y);
      var cp2x = inst.x   + 2/3 * (inst.cpx-inst.x);
      var cp2y = inst.y   + 2/3 * (inst.cpy-inst.y);
       
      var bounds = createjs.cubicBzBounds(cur_pt,
                                          { x:cp1x, y:cp1y },
                                          { x:cp2x, y:cp2y },
                                          inst);
      pending_points.push({ x:bounds[0], y:bounds[1] }); // top-left
      pending_points.push({ x:bounds[2], y:bounds[3] }); // bottom-right
    }

    // BezierCurveTo
    else if (inst instanceof G.BezierCurveTo) {
      var bounds = createjs.cubicBzBounds(cur_pt,
                                          { x:inst.cp1x, y:inst.cp1y },
                                          { x:inst.cp2x, y:inst.cp2y },
                                          inst);
      pending_points.push({ x:bounds[0], y:bounds[1] }); // top-left
      pending_points.push({ x:bounds[2], y:bounds[3] }); // bottom-right
    }

    // Circle
    else if (inst instanceof G.Circle) {
      pending_points.push({ x:inst.x, y:inst.y-inst.radius }); // top
      pending_points.push({ x:inst.x, y:inst.y+inst.radius }); // bottom
      pending_points.push({ x:inst.x-inst.radius, y:inst.y }); // left
      pending_points.push({ x:inst.x+inst.radius, y:inst.y }); // right
    }

    // Ellipse
    else if (inst instanceof G.Ellipse) {
      pending_points.push({ x:inst.x+inst.w/2, y:inst.y }); // top
      pending_points.push({ x:inst.x+inst.w/2, y:inst.y+inst.h }); // bottom
      pending_points.push({ x:inst.x, y:inst.y+inst.h/2 }); // left
      pending_points.push({ x:inst.x+inst.w, y:inst.y+inst.h/2 }); // right
    }

    // Rect / RoundRect
    else if (inst instanceof G.Rect ||
             inst instanceof G.RoundRect) {
      pending_points.push({ x:inst.x, y:inst.y }); // top-left
      pending_points.push({ x:inst.x+inst.w, y:inst.y+inst.h }); // bottom-right
    }

    // TODO: Arc
    // TODO: ArcTo
    // TODO: PolyStar

  }
  return { x:minX, y:minY, w:(maxX-minX), h:(maxY-minY) };
}


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
  if (a==0) a = -0.0000001; // stability addition
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
