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
