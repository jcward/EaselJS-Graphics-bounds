// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// This drawAndSizeCanvas function licensed MIT, (c) Jeff Ward 2017  -
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
